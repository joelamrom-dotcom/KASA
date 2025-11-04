"""
AI Analysis Service using Python libraries
Provides text analysis, sentiment analysis, data insights, and more
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from typing import Dict, List, Any
import requests

app = Flask(__name__)
CORS(app)

# Try to import analysis libraries (graceful fallback if not installed)
try:
    from textblob import TextBlob
    TEXTBLOB_AVAILABLE = True
except ImportError:
    TEXTBLOB_AVAILABLE = False

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    VADER_AVAILABLE = True
    vader_analyzer = SentimentIntensityAnalyzer()
except ImportError:
    VADER_AVAILABLE = False

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False


def analyze_sentiment(text: str) -> Dict[str, Any]:
    """Analyze sentiment of text using multiple methods"""
    results = {
        'text': text,
        'methods': {}
    }
    
    # TextBlob sentiment
    if TEXTBLOB_AVAILABLE:
        try:
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity
            subjectivity = blob.sentiment.subjectivity
            
            results['methods']['textblob'] = {
                'polarity': round(polarity, 3),
                'subjectivity': round(subjectivity, 3),
                'sentiment': 'positive' if polarity > 0.1 else 'negative' if polarity < -0.1 else 'neutral'
            }
        except Exception as e:
            results['methods']['textblob'] = {'error': str(e)}
    
    # VADER sentiment
    if VADER_AVAILABLE:
        try:
            scores = vader_analyzer.polarity_scores(text)
            results['methods']['vader'] = {
                'compound': round(scores['compound'], 3),
                'positive': round(scores['pos'], 3),
                'neutral': round(scores['neu'], 3),
                'negative': round(scores['neg'], 3),
                'sentiment': 'positive' if scores['compound'] > 0.05 else 'negative' if scores['compound'] < -0.05 else 'neutral'
            }
        except Exception as e:
            results['methods']['vader'] = {'error': str(e)}
    
    return results


def analyze_text_insights(text: str) -> Dict[str, Any]:
    """Extract insights from text"""
    blob = TextBlob(text) if TEXTBLOB_AVAILABLE else None
    
    insights = {
        'word_count': len(text.split()),
        'character_count': len(text),
        'sentence_count': len(text.split('.')) if '.' in text else 1,
        'paragraph_count': len(text.split('\n\n')) if '\n\n' in text else 1,
    }
    
    if blob:
        try:
            insights['noun_phrases'] = list(blob.noun_phrases)[:10]  # Top 10
            insights['words'] = list(blob.words)[:20]  # Top 20 words
        except:
            pass
    
    return insights


def analyze_data(data: List[Dict] or List[List]) -> Dict[str, Any]:
    """Analyze structured data"""
    if not PANDAS_AVAILABLE:
        return {'error': 'Pandas not available for data analysis'}
    
    try:
        df = pd.DataFrame(data)
        
        analysis = {
            'shape': {'rows': len(df), 'columns': len(df.columns)},
            'columns': list(df.columns),
            'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
            'summary': df.describe().to_dict() if len(df.select_dtypes(include=['number']).columns) > 0 else {},
            'missing_values': df.isnull().sum().to_dict(),
        }
        
        # Add correlations if numeric columns exist
        numeric_cols = df.select_dtypes(include=['number']).columns
        if len(numeric_cols) > 1:
            analysis['correlations'] = df[numeric_cols].corr().to_dict()
        
        return analysis
    except Exception as e:
        return {'error': str(e)}


def get_ai_analysis(text: str, analysis_type: str = 'general') -> Dict[str, Any]:
    """Get AI-powered analysis using free APIs"""
    
    # Try Hugging Face Inference API (free, no API key needed)
    try:
        hf_response = requests.post(
            'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
            headers={'Content-Type': 'application/json'},
            json={
                'inputs': f"""Analyze the following text and provide insights:

Text: {text}

Analysis Type: {analysis_type}

Provide:
1. Key themes and topics
2. Main points or findings
3. Important insights
4. Recommendations (if applicable)

Analysis:""",
                'parameters': {
                    'max_new_tokens': 500,
                    'temperature': 0.7,
                    'return_full_text': False
                }
            },
            timeout=30
        )
        
        if hf_response.status_code == 200:
            hf_data = hf_response.json()
            if isinstance(hf_data, list) and len(hf_data) > 0:
                ai_analysis = hf_data[0].get('generated_text', '')
                return {'ai_analysis': ai_analysis.strip(), 'provider': 'huggingface'}
    except Exception as e:
        pass
    
    # Fallback: Return structured analysis
    return {
        'ai_analysis': 'AI analysis unavailable. Please check your configuration.',
        'provider': 'fallback'
    }


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'libraries': {
            'textblob': TEXTBLOB_AVAILABLE,
            'vader': VADER_AVAILABLE,
            'pandas': PANDAS_AVAILABLE
        }
    })


@app.route('/analyze', methods=['POST'])
def analyze():
    """Main analysis endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        analysis_type = data.get('type', 'general')  # general, sentiment, data, ai
        text = data.get('text', '')
        structured_data = data.get('data', None)
        
        result = {
            'type': analysis_type,
            'analysis': {}
        }
        
        # Text analysis
        if text:
            if analysis_type in ['sentiment', 'general', 'all']:
                result['analysis']['sentiment'] = analyze_sentiment(text)
            
            if analysis_type in ['insights', 'general', 'all']:
                result['analysis']['text_insights'] = analyze_text_insights(text)
            
            if analysis_type in ['ai', 'general', 'all']:
                result['analysis']['ai_analysis'] = get_ai_analysis(text, analysis_type)
        
        # Structured data analysis
        if structured_data:
            if analysis_type in ['data', 'general', 'all']:
                result['analysis']['data_analysis'] = analyze_data(structured_data)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/analyze/sentiment', methods=['POST'])
def analyze_sentiment_endpoint():
    """Sentiment analysis endpoint"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        return jsonify(analyze_sentiment(text))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/analyze/text', methods=['POST'])
def analyze_text_endpoint():
    """Text insights endpoint"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        return jsonify({
            'insights': analyze_text_insights(text),
            'sentiment': analyze_sentiment(text)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/analyze/data', methods=['POST'])
def analyze_data_endpoint():
    """Data analysis endpoint"""
    try:
        data = request.get_json()
        structured_data = data.get('data', [])
        
        if not structured_data:
            return jsonify({'error': 'Data is required'}), 400
        
        return jsonify(analyze_data(structured_data))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

