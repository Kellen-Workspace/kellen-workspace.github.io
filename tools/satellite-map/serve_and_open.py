#!/usr/bin/env python3
"""Serve current directory and open an HTML file in the default browser.

Usage:
  python serve_and_open.py -f index.html -p 8000 -d .
"""
import argparse
import http.server
import socketserver
import threading
import webbrowser
import os
import time
import socket


def find_free_port():
    s = socket.socket()
    s.bind(("", 0))
    port = s.getsockname()[1]
    s.close()
    return port


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


def serve(port, directory):
    os.chdir(directory)
    handler = QuietHandler
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"Serving {os.path.abspath(directory)} at http://localhost:{port}/")
        try:
            httpd.serve_forever()
        except Exception:
            pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-f", "--file", default="index.html", help="HTML file to open")
    parser.add_argument("-p", "--port", type=int, help="Port to serve on (default: free port)")
    parser.add_argument("-d", "--dir", default=".", help="Directory to serve (default: current directory)")
    args = parser.parse_args()

    directory = args.dir
    if not os.path.isdir(directory):
        print(f"Directory not found: {directory}")
        raise SystemExit(1)

    port = args.port or find_free_port()

    t = threading.Thread(target=serve, args=(port, directory), daemon=True)
    t.start()

    url = f"http://localhost:{port}/{args.file}"
    print(f"Opening {url}")
    webbrowser.open(url)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopping server and exiting.")


if __name__ == "__main__":
    main()
