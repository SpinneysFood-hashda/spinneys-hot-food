from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import webbrowser

ROOT = Path(__file__).resolve().parent
PORT = 8080

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

url = f"http://localhost:{PORT}/"
print(f"Spinneys Hot Food: {url}")
print("Press Ctrl+C to stop.")
webbrowser.open(url)
ThreadingHTTPServer(("localhost", PORT), Handler).serve_forever()
