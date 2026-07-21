const http = require('http');
const { request } = require('http');

const TARGET_WEB = { host: '127.0.0.1', port: 3001 };
const TARGET_API = { host: '127.0.0.1', port: 5000 };

const server = http.createServer((req, res) => {
  const isApi = req.url.startsWith('/api/');
  const target = isApi ? TARGET_API : TARGET_WEB;

  const options = {
    host: target.host,
    port: target.port,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `${target.host}:${target.port}` },
  };

  const proxied = request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxied.on('error', (error) => {
    res.writeHead(502, { 'content-type': 'text/plain' });
    res.end(`Proxy error: ${error.message}`);
  });

  req.pipe(proxied);
});

server.listen(8080, '0.0.0.0', () => {
  console.log('Gateway proxy running on http://localhost:8080');
});
