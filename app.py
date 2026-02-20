import streamlit as st
import json
from groq import Groq
from tavily import TavilyClient

# 🔑 API KEYS
GROQ_API_KEY = "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"
TAVILY_API_KEY = "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"

groq_client = Groq(api_key=GROQ_API_KEY)
tavily_client = TavilyClient(api_key=TAVILY_API_KEY)

MODEL_NAME = "openai/gpt-oss-20b"
# MODEL_NAME = "openai/gpt-oss-120b"  # 🔥 Upgrade later


# ==============================
# ✅ CLEAN JSON (CRITICAL FIX)
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
@st.cache_data(show_spinner=False)
def search_web(query):

    response = tavily_client.search(
        query=query,
        search_depth="basic",
        max_results=5
    )

    evidence_blocks = []

    for r in response["results"]:
        evidence_blocks.append(
            f"""
Title: {r['title']}
URL: {r['url']}
Content: {r['content']}
"""
        )

    return "\n".join(evidence_blocks)


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
# ✅ CONFIDENCE METER
# ==============================
def confidence_meter(score):

    if score > 75:
        level = "High Confidence"
        color = "#16a34a"
    elif score > 45:
        level = "Moderate Confidence"
        color = "#ca8a04"
    else:
        level = "Low Confidence"
        color = "#dc2626"

    st.markdown("### 📊 Confidence Level")
    st.progress(score / 100)

    st.markdown(f"""
    <div style="
        margin-top:10px;
        padding:12px;
        border-radius:12px;
        background-color:{color};
        color:white;
        text-align:center;
        font-weight:bold;
        box-shadow: 0 0 15px {color};
    ">
        {score}% — {level}
    </div>
    """, unsafe_allow_html=True)


# ==============================
# ✅ VERDICT BOX
# ==============================
def verdict_box(verdict):

    if verdict == "Real":
        color = "#16a34a"
        glow = "0 0 30px rgba(22,163,74,0.9)"
    else:
        color = "#dc2626"
        glow = "0 0 30px rgba(220,38,38,0.9)"

    st.markdown(f"""
    <div style="
        padding:30px;
        border-radius:16px;
        background-color:{color};
        color:white;
        font-size:28px;
        font-weight:bold;
        text-align:center;
        box-shadow:{glow};
        animation: pulse 1.5s infinite;
    ">
        {verdict}
    </div>

    <style>
    @keyframes pulse {{
        0% {{ box-shadow: {glow}; }}
        50% {{ box-shadow: 0 0 45px {color}; }}
        100% {{ box-shadow: {glow}; }}
    }}
    </style>
    """, unsafe_allow_html=True)


# ==============================
# ✅ UI CONFIG
# ==============================
st.set_page_config(
    page_title="Real or Cap",
    page_icon="🧠",
    layout="wide"
)

st.title("🧠 Real or Cap — AI Fact Checker")
st.write("Live web retrieval + evidence-grounded reasoning")

query = st.text_input("Enter your claim / question:")


# ==============================
# ✅ BUTTON ACTION
# ==============================
if st.button("Fact Check 🔎"):

    if not query:
        st.warning("Please enter a question.")
    else:

        with st.spinner("Searching the web... 🌍"):
            evidence = search_web(query)

        st.subheader("📚 Retrieved Evidence")
        st.text_area("Search Results", evidence, height=200)

        with st.spinner("Analyzing evidence... 🧠"):
            raw_answer = ask_llm(query, evidence)

        try:
            cleaned = clean_json_response(raw_answer)
            result = json.loads(cleaned)

            verdict = result["verdict"]
            confidence = int(result["confidence"])
            explanation = result["explanation"]
            citations = result["citations"]

            # ✅ Guardrails
            confidence = max(0, min(confidence, 100))

            col1, col2 = st.columns([1, 3])

            with col1:
                confidence_meter(confidence)

            with col2:
                verdict_box(verdict)

                st.subheader("🧠 Explanation")
                st.write(explanation)

                st.subheader("🔗 Citations")
                for c in citations:
                    st.markdown(f"- {c}")

        except Exception as e:
            st.error("Parsing failed 😅")
            st.write(raw_answer)