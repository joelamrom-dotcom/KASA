# Python AI Analysis Service

A powerful Python-based AI analysis service using popular analysis libraries.

## Features

- **Sentiment Analysis** - TextBlob and VADER sentiment analysis
- **Text Insights** - Word count, key phrases, noun extraction
- **Data Analysis** - Statistical analysis using Pandas
- **AI-Powered Analysis** - Uses Hugging Face models for deep insights

## Installation

```bash
cd python-ai-service
pip install -r requirements.txt
```

## Usage

### Start the service:
```bash
python analyzer.py
```

The service runs on `http://localhost:5000`

## API Endpoints

### POST `/analyze`
Main analysis endpoint - analyzes text and/or data

**Request:**
```json
{
  "type": "general",
  "text": "Your text to analyze",
  "data": [{"col1": 1, "col2": 2}]
}
```

**Response:**
```json
{
  "type": "general",
  "analysis": {
    "sentiment": {...},
    "text_insights": {...},
    "ai_analysis": {...}
  }
}
```

### POST `/analyze/sentiment`
Sentiment analysis only

### POST `/analyze/text`
Text insights and sentiment

### POST `/analyze/data`
Structured data analysis

### GET `/health`
Health check and library availability

## Analysis Types

- `general` - All analysis types
- `sentiment` - Sentiment analysis only
- `insights` - Text insights only
- `data` - Data analysis only
- `ai` - AI-powered analysis only
- `all` - Everything

## Libraries Used

- **Flask** - Web framework
- **TextBlob** - Text processing and sentiment
- **VADER** - Sentiment analysis
- **Pandas** - Data analysis
- **Hugging Face** - AI models (via API)

