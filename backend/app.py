from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from groq import Groq
from tavily import TavilyClient

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# 🔑 API KEYS
GROQ_API_KEY = "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"
TAVILY_API_KEY = "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"

groq_client = Groq(api_key=GROQ_API_KEY)
tavily_client = TavilyClient(api_key=TAVILY_API_KEY)

# choose a model permitted for the project; gpt-oss-20b was blocked so switch to a mini model
MODEL_NAME = "openai/gpt-oss-20b"
CHAT_MODEL = "openai/gpt-oss-20b"  # can be same or another free mini model


# ==============================
# ✅ CLEAN JSON
# ==============================
def clean_json_response(raw_text):
    raw_text = raw_text.strip()

    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]

    raw_text = raw_text.replace("json", "").strip()

    return raw_text


# ==============================
# ✅ SEARCH WEB
# ==============================
def search_web(query):
    response = tavily_client.search(
        query=query,
        search_depth="basic",
        max_results=5
    )

    evidence_blocks = []
    raw_results = []

    for r in response["results"]:
        # Guardrail: Exclude Facebook, Reddit, Quora, X/Twitter posts
        url_lower = r["url"].lower()
        if any(domain in url_lower for domain in ["facebook.com", "reddit.com", "quora.com", "twitter.com", "x.com","youtube.com","instagram.com"]):
            continue
        evidence_blocks.append(
            f"""
Title: {r['title']}
URL: {r['url']}
Content: {r['content']}
"""
        )
        raw_results.append({
            "title": r['title'],
            "url": r['url'],
            "content": r['content']
        })

    return "\n".join(evidence_blocks), raw_results


# ==============================
# ✅ ASK LLM
# ==============================
def ask_llm(query, evidence):
    prompt = f"""
User Question:
{query}

Web Evidence:
{evidence}

Return ONLY valid JSON:

{{
  "verdict": "Real" or "Cap",
  "confidence": number (0-100),
  "explanation": "short reasoning",
  "citations": ["url1", "url2"]
}}

Rules:
- Use ONLY provided evidence
- Real = supported by evidence
- Cap = contradicted / misleading / unsupported
"""

    response = groq_client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )

    return response.choices[0].message.content


# ==============================
# ✅ API ENDPOINTS
# ==============================
@app.route('/api/fact-check', methods=['POST'])
def fact_check():
    try:
        data = request.json
        query = data.get('query', '').strip()

        if not query:
            return jsonify({"error": "Query is required"}), 400

        # Search web
        evidence_text, raw_results = search_web(query)

        # Ask LLM
        raw_answer = ask_llm(query, evidence_text)

        # Parse response
        cleaned = clean_json_response(raw_answer)
        result = json.loads(cleaned)

        # Guardrail: Remove Facebook, Reddit, Quora, X/Twitter URLs from citations
        block_domains = ["facebook.com", "reddit.com", "quora.com", "twitter.com", "x.com","youtube.com","instagram.com"]
        citations = [url for url in result.get("citations", []) if not any(domain in url.lower() for domain in block_domains)]

        # Validate confidence
        confidence = int(result.get("confidence", 0))
        confidence = max(0, min(confidence, 100))

        # build witness text from the text of each search result (the links/evidence)
        witness_text = "\n".join([
            f"Title: {r['title']}\nContent: {r['content']}" for r in raw_results
        ])

        return jsonify({
            "success": True,
            "verdict": result.get("verdict"),
            "confidence": confidence,
            "explanation": result.get("explanation"),
            # send the concatenated search result contents as witness knowledge
            "witness": witness_text,
            "citations": citations,
            "searchResults": raw_results
        }), 200

    except json.JSONDecodeError:
        return jsonify({"error": "Failed to parse LLM response"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==============================
# ✅ RECENT NEWS
# ==============================
def search_news(limit: int = 10):
    """Use the Tavily client to fetch the latest news headlines."""
    # a very simple query that should return current news results
    response = tavily_client.search(
        query="latest news",
        search_depth="basic",
        max_results=limit,
    )

    articles = []
    for r in response.get("results", []):
        url_lower = r["url"].lower()
        # filter out social media posts
        if any(domain in url_lower for domain in [
            "facebook.com",
            "reddit.com",
            "quora.com",
            "twitter.com",
            "x.com",
            "youtube.com",
            "instagram.com",
        ]):
            continue
        articles.append({
            "title": r.get("title", "No title"),
            "url": r.get("url"),
        })
        if len(articles) >= limit:
            break
    return articles


@app.route('/api/news', methods=['GET'])
def news():
    try:
        articles = search_news(limit=10)
        return jsonify({"success": True, "articles": articles}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"}), 200


# ==============================
# ✅ WITNESS CHAT
# ==============================
def chat_with_witness(witness_text, history):
    """Run a conversational model with the witness information as context.
    `history` should be a list of dicts with keys 'role' and 'content'.
    """
    system_msg = (
        "You are a helpful assistant that can only answer based on the provided witness information. "
        "Do NOT invent answers; if the information is insufficient, respond with 'I don't know based on the witness information.'\n\n"
        f"Witness Information:\n{witness_text}"
    )
    messages = [{"role": "system", "content": system_msg}] + history
    response = groq_client.chat.completions.create(
        model=CHAT_MODEL,
        messages=messages,
        temperature=0.2,
    )
    return response.choices[0].message.content


@app.route('/api/witness-chat', methods=['POST'])
def witness_chat():
    data = request.json or {}
    witness_text = data.get('witness', '').strip()
    history = data.get('history', [])
    if not witness_text or not isinstance(history, list):
        return jsonify({"success": False, "error": "Invalid payload"}), 400

    try:
        reply = chat_with_witness(witness_text, history)
        return jsonify({"success": True, "reply": reply}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ==============================
# ✅ STATIC FRONTEND
# ==============================
from flask import send_from_directory
import os

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serve the static HTML/CSS/JS frontend located at the project root."""
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
    file_path = os.path.join(root_dir, 'index.html')
    if path and os.path.exists(os.path.join(root_dir, path)):
        return send_from_directory(root_dir, path)
    return send_from_directory(root_dir, 'index.html')


if __name__ == "__main__":
    app.run(debug=True, port=5000)
