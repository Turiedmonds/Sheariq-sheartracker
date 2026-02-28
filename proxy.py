from http.server import BaseHTTPRequestHandler, HTTPServer
import requests

SHELLY_URL = "http://192.168.33.1/rpc/Shelly.GetStatus"

class ProxyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/shelly":
            try:
                response = requests.get(SHELLY_URL, timeout=5)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(response.content)
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode())
        else:
            self.send_response(404)
            self.end_headers()

def run():
    server_address = ("localhost", 5000)
    httpd = HTTPServer(server_address, ProxyHandler)
    print("Proxy running at http://localhost:5000")
    httpd.serve_forever()

if __name__ == "__main__":
    run()