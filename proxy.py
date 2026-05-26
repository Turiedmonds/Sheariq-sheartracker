from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse
import requests

DEFAULT_SHELLY_IP = "192.168.33.1"
SHELLY_URL_TEMPLATE = "http://{ip}/rpc/Shelly.GetStatus"


def sanitize_ip(raw_ip):
    ip = (raw_ip or "").strip()
    if not ip:
        return DEFAULT_SHELLY_IP

    parts = ip.split(".")
    if len(parts) != 4:
        return DEFAULT_SHELLY_IP

    for part in parts:
        if not part.isdigit():
            return DEFAULT_SHELLY_IP
        value = int(part)
        if value < 0 or value > 255:
            return DEFAULT_SHELLY_IP

    return ip

class ProxyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/shelly":
            try:
                query_params = parse_qs(parsed.query)
                requested_ip = query_params.get("ip", [""])[0]
                shelly_ip = sanitize_ip(requested_ip)
                shelly_url = SHELLY_URL_TEMPLATE.format(ip=shelly_ip)

                response = requests.get(shelly_url, timeout=5)
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