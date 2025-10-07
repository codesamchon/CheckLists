#!/usr/bin/env python3
"""
Tiny static server that also accepts PUT /data.json to persist changes.

Run from the project root:
    python server.py

This listens on port 8000 and writes incoming PUT body to ./data.json
"""
import http.server
import socketserver
import os
import urllib.parse

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/data.json':
            length = int(self.headers.get('Content-Length', 0))
            data = self.rfile.read(length)
            with open('data.json', 'wb') as f:
                f.write(data)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'OK')
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    # serve from this script's directory
    os.chdir(os.path.dirname(__file__) or '.')
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving HTTP on port {PORT} (http://localhost:{PORT}) ...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nShutting down')
