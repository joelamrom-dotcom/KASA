from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))

try:
    from analyze_future_trends import main as analyze_main
except ImportError:
    # Fallback if import fails
    import importlib.util
    script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'analyze_future_trends.py')
    spec = importlib.util.spec_from_file_location("analyze_future_trends", script_path)
    analyze_future_trends = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(analyze_future_trends)
    analyze_main = analyze_future_trends.main

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.do_POST()  # Handle GET same as POST
    
    def do_POST(self):
        try:
            # Get query parameters
            from urllib.parse import urlparse, parse_qs
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            years_ahead = int(query_params.get('years', ['10'])[0])
            
            # Read JSON data from request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
            else:
                # Empty data - will use defaults in analysis
                data = {}
            
            # Call the analysis function
            result = analyze_main(data, years_ahead)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode('utf-8'))
            
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            error_response = {
                'error': str(e),
                'type': type(e).__name__,
                'traceback': error_trace
            }
            self.wfile.write(json.dumps(error_response).encode('utf-8'))
