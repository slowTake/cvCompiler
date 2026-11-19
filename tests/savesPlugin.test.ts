import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { handleSaves, isValidSaveName } from '../server/savesPlugin';

describe('isValidSaveName', () => {
  it('accepts plain .json names', () => {
    expect(isValidSaveName('peter-nurmi-cv.json')).toBe(true);
    expect(isValidSaveName('cv_2026.11.json')).toBe(true);
  });

  it('rejects traversal, separators, hidden files and other extensions', () => {
    for (const name of ['../x.json', 'a/b.json', 'a\\b.json', '.env.json', 'cv.txt', 'a..b.json', '']) {
      expect(isValidSaveName(name)).toBe(false);
    }
  });
});

describe('saves endpoint', () => {
  let dir: string;
  let server: Server;
  let base: string;
  const headers = { 'x-cv-saves': '1' };

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'cv-saves-'));
    server = createServer((req, res) => void handleSaves(req, res, path.join(dir, 'saves')));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/__saves`;
  });

  afterEach(async () => {
    server.close();
    await rm(dir, { recursive: true, force: true });
  });

  it('lists nothing before the first save', async () => {
    const res = await fetch(base, { headers });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('writes, lists and reads back a file', async () => {
    const put = await fetch(`${base}/me.json`, { method: 'PUT', headers, body: '{"a":1}' });
    expect(put.status).toBe(200);
    expect(await readFile(path.join(dir, 'saves', 'me.json'), 'utf8')).toBe('{"a":1}');

    const list = (await (await fetch(base, { headers })).json()) as { name: string }[];
    expect(list.map((f) => f.name)).toEqual(['me.json']);
    expect(await (await fetch(`${base}/me.json`, { headers })).text()).toBe('{"a":1}');
  });

  it('refuses requests without the header', async () => {
    expect((await fetch(base)).status).toBe(403);
    expect((await fetch(`${base}/me.json`, { method: 'PUT', body: '{}' })).status).toBe(403);
  });

  it('refuses bad names, bad JSON and unknown files', async () => {
    expect((await fetch(`${base}/..%2Fevil.json`, { method: 'PUT', headers, body: '{}' })).status).toBe(400);
    expect((await fetch(`${base}/me.json`, { method: 'PUT', headers, body: 'nope' })).status).toBe(400);
    expect((await fetch(`${base}/missing.json`, { headers })).status).toBe(404);
  });

  it('ignores non-CV files in the folder', async () => {
    await fetch(`${base}/me.json`, { method: 'PUT', headers, body: '{}' });
    await writeFile(path.join(dir, 'saves', 'notes.txt'), 'x');
    const list = (await (await fetch(base, { headers })).json()) as { name: string }[];
    expect(list.map((f) => f.name)).toEqual(['me.json']);
  });
});
