import { mkdir, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import type { Plugin } from 'vite';

/**
 * Dev-server only: lets the app save CV JSON files into a folder of the local
 * checkout (saves/, git-ignored) and open them again. Browsers cannot write to
 * an arbitrary folder, and Firefox has no File System Access API at all, so
 * the dev server does the writing.
 *
 * Routes: GET /__saves (list), GET /__saves/<name>, PUT /__saves/<name>.
 * Every request needs the `x-cv-saves` header. A custom header forces a CORS
 * preflight for cross-site pages, which this server never answers, so another
 * website cannot write into your folder through your browser.
 */

export const SAVES_ROUTE = '/__saves';
export const SAVES_HEADER = 'x-cv-saves';
const MAX_BYTES = 2 * 1024 * 1024;
const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}\.json$/;

export function isValidSaveName(name: string): boolean {
  return NAME.test(name) && !name.includes('..');
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function send(res: ServerResponse, status: number, body: string, type = 'text/plain'): void {
  res.statusCode = status;
  res.setHeader('content-type', `${type}; charset=utf-8`);
  res.setHeader('cache-control', 'no-store');
  res.end(body);
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = chunk as Buffer;
    size += buf.length;
    if (size > MAX_BYTES) throw new HttpError(413, 'File too large');
    chunks.push(buf);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function handleSaves(
  req: IncomingMessage,
  res: ServerResponse,
  dir: string,
): Promise<void> {
  try {
    if (req.headers[SAVES_HEADER] !== '1') throw new HttpError(403, 'Missing header');
    const sub = decodeURIComponent((req.url ?? '').split('?')[0]!.slice(SAVES_ROUTE.length)).replace(
      /^\//,
      '',
    );

    if (sub === '') {
      if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed');
      const names = await readdir(dir).catch(() => [] as string[]);
      const files = await Promise.all(
        names.filter(isValidSaveName).map(async (name) => ({
          name,
          modified: (await stat(path.join(dir, name))).mtimeMs,
        })),
      );
      files.sort((a, b) => b.modified - a.modified);
      return send(res, 200, JSON.stringify(files), 'application/json');
    }

    if (!isValidSaveName(sub)) throw new HttpError(400, 'Invalid file name');
    const file = path.join(dir, sub);

    if (req.method === 'GET') {
      const text = await readFile(file, 'utf8').catch(() => null);
      if (text === null) throw new HttpError(404, 'Not found');
      return send(res, 200, text, 'application/json');
    }

    if (req.method === 'PUT') {
      const text = await readBody(req);
      try {
        JSON.parse(text);
      } catch {
        throw new HttpError(400, 'Body is not valid JSON');
      }
      await mkdir(dir, { recursive: true });
      // Write then rename, so a crash never leaves a half-written CV behind.
      const tmp = `${file}.tmp`;
      await writeFile(tmp, text, 'utf8');
      await rename(tmp, file);
      return send(res, 200, 'ok');
    }

    throw new HttpError(405, 'Method not allowed');
  } catch (err) {
    if (err instanceof HttpError) return send(res, err.status, err.message);
    console.error(err);
    send(res, 500, 'Server error');
  }
}

export function cvSaves(dir: string): Plugin {
  return {
    name: 'cvcompiler:saves',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(SAVES_ROUTE, (req, res) => {
        // `use` strips the mount path; put it back so handleSaves sees the full route.
        req.url = SAVES_ROUTE + (req.url ?? '');
        void handleSaves(req, res, dir);
      });
    },
  };
}
