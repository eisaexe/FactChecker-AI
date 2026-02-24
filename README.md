# 🧠 Real or Cap - AI Fact Checker

A full-stack web application for fact-checking claims with AI-powered analysis and live web evidence retrieval.

## 🎯 Features

- **AI-Powered Analysis**: Uses Groq's fast LLM for intelligent fact-checking
- **Live Web Search**: Retrieves current web evidence using Tavily API
- **Professional UI**: Beautiful, responsive static frontend with card-based design
- **Live headlines**: Top‑10 news ticker displayed at top of homepage
- **Confidence Scoring**: Displays confidence level with visual progress bar
- **Citation Tracking**: Direct links to evidence sources
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

### Backend
- **Python 3.9+**
- **Flask** - Web framework
- **Groq API** - AI analysis
- **Tavily API** - Web search
- **Flask-CORS** - Cross-origin support

### Frontend
- **Static HTML/CSS/JavaScript** served directly from `index.html`
- **Axios** or `fetch` for API calls

## 📋 Prerequisites

- Python 3.9 or higher
- Groq API key
- Tavily API key

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repo-url>
cd FactChecker-AI
```

### 2. Backend Setup

#### Create Virtual Environment (Windows)
```bash
cd backend
python -m venv venv
venv\Scripts\activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Configure Environment Variables
Create a `.env` file in the backend directory:
```
GROQ_API_KEY=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
TAVILY_API_KEY=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
FLASK_ENV=development
FLASK_DEBUG=True
```

#### Run Backend Server
```bash
python app.py
```

The backend will start at `http://localhost:5000`

### 3. Frontend / Client

No build step is required. The user interface is contained in the root
`index.html` file along with accompanying CSS/JS. Simply open the file in
your browser or serve it from any static file server. API requests are
proxied to `http://localhost:5000` when running locally.

## 📁 Project Structure

```
FactChecker-AI/
├── backend/
│   ├── app.py              # Flask API server
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment variables template
│
├── index.html              # Static frontend (HTML/CSS/JS)
├── README.md
```

## 🔄 How It Works

1. **User Input**: User enters a claim or question in the search bar
2. **Web Search**: Backend searches the web using Tavily API for current evidence
3. **News Feed**: Supports fetching latest headlines to display in a scrolling ticker
3. **AI Analysis**: Groq LLM analyzes the claim against retrieved evidence
4. **Results Display**: Frontend displays:
   - Verdict (Real/Cap)
   - Confidence score with progress bar
   - Explanation of reasoning
   - Citations with links to sources
   - Full search results with expandable content

## 🎨 UI Components

### SearchBar
Input field for fact-checking queries with real-time validation

### VerdictCard
Large animated card displaying the fact-check verdict (Real/Cap) with visual indicators

### ConfidenceCard
Shows confidence score with:
- Animated progress bar
- Confidence level (High/Moderate/Low)
- Descriptive text about the confidence

### ExplanationCard
Detailed explanation of the fact-check reasoning

### CitationsCard
Interactive links to source materials used in analysis

### SearchResultsCard
Expandable cards showing full web search results with:
- Title and URL
- Content snippet
- Links to full articles

## 🔌 API Endpoints

### `POST /api/fact-check`
Fact-checks a claim.

**Request:**
```json
{
  "query": "Is the Earth flat?"
}
```

**Response:**
```json
{
  "success": true,
  "verdict": "Cap",
  "confidence": 98,
  "explanation": "Multiple space agencies and scientific evidence confirm the Earth is spherical.",
  "citations": ["https://nasa.gov/...", "https://science.org/..."],
  "searchResults": [
    {
      "title": "Earth Shape",
      "url": "https://example.com",
      "content": "The Earth is spherical..."
    }
  ]
}
```

### `GET /api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```bash
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
FLASK_ENV=development  # or production
FLASK_DEBUG=True       # or False for production
```

### Model Selection (Backend)

In `backend/app.py`, you can change the LLM model:

```python
MODEL_NAME = "openai/gpt-oss-20b"  # Current model
# MODEL_NAME = "openai/gpt-oss-120b"  # Upgrade for better accuracy
```

## 📱 Responsive Design Features

- **Desktop**: 2-column layout with detailed information
- **Tablet**: Adaptive grid layout
- **Mobile**: Single-column layout optimized for smaller screens

## 🎨 Styling Highlights

- Modern gradient backgrounds
- Smooth animations and transitions
- Card-based component design
- Color-coded verdicts (Green for Real, Red for Cap)
- Professional color scheme with purple accents

## 🐛 Troubleshooting

### Backend Not Connecting
- Ensure Flask server is running on `http://localhost:5000`
- Check console for error messages
- Verify API keys are correct

### API Key Errors
- Verify that `GROQ_API_KEY` and `TAVILY_API_KEY` are correctly set
- Check that keys are valid and not expired
- Ensure no extra whitespace in `.env` file

### Frontend Not Loading
- Open `index.html` in your browser or serve it with a simple HTTP server (e.g. `python -m http.server` from workspace root)
- Clear browser cache if changes aren’t appearing

## 🚀 Deployment

### Deploy Backend (Heroku)
```bash
heroku create your-app-name
git push heroku main
```

### Deploy Frontend
Just serve the static `index.html` file using any hosting provider capable of serving HTML (GitHub Pages, Netlify, etc.). No build step is required.

## 📝 License

This project is provided as-is for educational and research purposes.

## 👨‍💻 Author

Mohammed Eisa - FactChecker-AI Project

---

**Made with ❤️ for accurate information discovery**
