"""Serves site/ locally with the content types GitHub Pages uses, so module scripts and WebAssembly load the same way."""
import functools
import http.server
import pathlib
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
SITE = pathlib.Path(__file__).resolve().parent.parent / "docs"


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      ".mjs": "text/javascript", ".js": "text/javascript", ".wasm": "application/wasm",
                      ".json": "application/json", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8"}

    def log_message(self, *args):
        pass


http.server.ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(Handler, directory=str(SITE))).serve_forever()
