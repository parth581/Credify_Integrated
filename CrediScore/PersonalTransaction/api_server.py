"""
Flask API Server for Bank Statement Analysis
This wraps your existing Python code and exposes it as REST API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Import your existing functions
from pdf_parser.parser import parse_pdf
from anonymization.entity_rewriter import anonymize_transactions
from features.transaction_features import extract_transaction_features
from features.balance_features import extract_balance_features
from features.data_quality_features import extract_data_quality_features
from ai_agent.llm_client import run_ai_agent

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "bank-statement-analyzer"
    })


@app.route('/api/analyze', methods=['POST'])
def analyze_statement():
    """
    Analyze bank statement PDF
    Expected: multipart/form-data with 'file' field
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                "error": "No file provided",
                "message": "Please upload a PDF file"
            }), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                "error": "No file selected",
                "message": "Please select a file"
            }), 400
        
        # Check if file is PDF
        if not file.filename.endswith('.pdf'):
            return jsonify({
                "error": "Invalid file type",
                "message": "Only PDF files are allowed"
            }), 400
        
        # Save file temporarily
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)
        
        try:
            # Process the PDF (your existing logic)
            raw_df = parse_pdf(filepath)
            safe_df = anonymize_transactions(raw_df)
            
            features = {
                "transaction": extract_transaction_features(safe_df),
                "balance": extract_balance_features(safe_df),
                "data_quality": extract_data_quality_features(safe_df)
            }
            
            # Run AI analysis
            analysis_result = run_ai_agent(features)
            
            # Return results
            return jsonify({
                "success": True,
                "data": {
                    "features": features,
                    "analysis": analysis_result
                }
            }), 200
            
        finally:
            # Clean up uploaded file
            if os.path.exists(filepath):
                os.remove(filepath)
    
    except Exception as e:
        return jsonify({
            "error": "Analysis failed",
            "message": str(e)
        }), 500


@app.route('/api/analyze-features', methods=['POST'])
def analyze_from_features():
    """
    Analyze pre-extracted features (no PDF upload needed)
    Expected JSON body with features object
    """
    try:
        data = request.get_json()
        
        if not data or 'features' not in data:
            return jsonify({
                "error": "Invalid request",
                "message": "Features object required"
            }), 400
        
        # Run AI analysis on provided features
        analysis_result = run_ai_agent(data['features'])
        
        return jsonify({
            "success": True,
            "data": {
                "analysis": analysis_result
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Analysis failed",
            "message": str(e)
        }), 500


if __name__ == '__main__':
    # Check if HF_API_KEY is set
    if not os.getenv("HF_API_KEY"):
        print("WARNING: HF_API_KEY not set in environment variables")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )