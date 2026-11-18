/* Local static-export verification server with the documented event fallback. */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve("out");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json",
};

http
  .createServer((request, response) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    const relative = pathname.startsWith("/events/")
      ? "events/local.html"
      : pathname === "/"
        ? "index.html"
        : path.extname(pathname)
          ? pathname.slice(1)
          : `${pathname.slice(1)}.html`;
    const file = path.resolve(root, relative);
    if (
      !file.startsWith(`${root}${path.sep}`) ||
      !fs.existsSync(file) ||
      !fs.statSync(file).isFile()
    ) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
    });
    fs.createReadStream(file).pipe(response);
  })
  .listen(3101, "127.0.0.1", () =>
    console.log("Static export verification: http://localhost:3101"),
  );
