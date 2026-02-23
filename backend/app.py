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

MODEL_NAME = "openai/gpt-oss-20b"


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
        # Guardrail: Exclude Facebook posts
        if "facebook.com" in r["url"].lower():
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

        # Guardrail: Remove Facebook URLs from citations
        citations = [url for url in result.get("citations", []) if "facebook.com" not in url.lower()]

        # Validate confidence
        confidence = int(result.get("confidence", 0))
        confidence = max(0, min(confidence, 100))

        return jsonify({
            "success": True,
            "verdict": result.get("verdict"),
            "confidence": confidence,
            "explanation": result.get("explanation"),
            "citations": citations,
            "searchResults": raw_results
        }), 200

    except json.JSONDecodeError:
        return jsonify({"error": "Failed to parse LLM response"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
