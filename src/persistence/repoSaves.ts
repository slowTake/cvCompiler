/**
 * Client for the dev server's saves/ folder (server/savesPlugin.ts). Only
 * exists under `npm run dev`; a production build has no such endpoint.
 */

export interface RepoSave {
  name: string;
  /** Milliseconds since the epoch. */
  modified: number;
}

export const supportsRepoSaves: boolean = import.meta.env.DEV;

const ROUTE = '/__saves';
const headers = { 'x-cv-saves': '1' };

async function ok(res: Response): Promise<Response> {
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()) || res.statusText}`);
  return res;
}

export async function listRepoSaves(): Promise<RepoSave[]> {
  return (await ok(await fetch(ROUTE, { headers }))).json();
}

export async function readRepoSave(name: string): Promise<string> {
  return (await ok(await fetch(`${ROUTE}/${encodeURIComponent(name)}`, { headers }))).text();
}

export async function writeRepoSave(name: string, text: string): Promise<void> {
  await ok(
    await fetch(`${ROUTE}/${encodeURIComponent(name)}`, { method: 'PUT', headers, body: text }),
  );
}
