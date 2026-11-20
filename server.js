import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/today', ['index.html', 'text/html; charset=utf-8']],
  ['/exercises', ['index.html', 'text/html; charset=utf-8']],
  ['/history', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/assets/icon.png', ['assets/icon.png', 'image/png']],
]);

const host = '127.0.0.1';
const port = Number(process.env.SET_PREVIEW_PORT ?? 4173);

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  const pathname = request.url.split('?', 1)[0];
  const file = /^\/js\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.js$/.test(pathname)
    ? [pathname.slice(1), 'text/javascript; charset=utf-8']
    : files.get(pathname);
  if (!file) {
    response.writeHead(404).end('Not found');
    return;
  }

  const [name, type] = file;
  try {
    const body = await readFile(new URL(`./dist/${name}`, import.meta.url));
    response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    if (error.code === 'ENOENT') {
      response.writeHead(404).end('Not found');
      return;
    }
    console.error(error.message);
    response.writeHead(500).end('Unable to read the app files');
  }
});

server.listen(port, host, () => {
  console.log(`Set — http://${host}:${server.address().port}`);
});
