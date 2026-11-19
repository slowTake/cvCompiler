#!/usr/bin/env node
/**
 * Prints a URL to an A4 PDF with a real browser engine, the way Print → Save
 * as PDF does. Used to test PDF round trips in both engines.
 *
 *   node scripts/print-pdf.mjs firefox <url> <out.pdf>
 *   node scripts/print-pdf.mjs chromium <url> <out.pdf>
 *
 * firefox:  geckodriver + Firefox, WebDriver "Print Page" (Firefox's print pipeline).
 * chromium: headless Brave/Chromium --print-to-pdf (Chromium's print pipeline;
 *           Chrome, Edge and Brave share it). Set CHROMIUM_BIN to pick a binary.
 */
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [engine, url, out] = process.argv.slice(2);
if (!engine || !url || !out) {
  console.error('usage: print-pdf.mjs firefox|chromium <url> <out.pdf>');
  process.exit(2);
}
const outPath = path.resolve(out);
mkdirSync(path.dirname(outPath), { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** geckodriver's port. One driver is started on first use and reused after that. */
const GECKO_PORT = Number(process.env.GECKO_PORT ?? 4444);

async function printFirefox() {
  const base = `http://127.0.0.1:${GECKO_PORT}`;
  const call = async (method, p, body) => {
    const res = await fetch(base + p, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`${method} ${p}: ${JSON.stringify(json.value)}`);
    return json.value;
  };
  const up = () => fetch(`${base}/status`).then(() => true, () => false);

  if (!(await up())) {
    // Snap Firefox can't read profiles in /tmp, so keep them under the output dir.
    const profileRoot = path.join(path.dirname(outPath), 'ff-profiles');
    mkdirSync(profileRoot, { recursive: true });
    // Detached and left running: the snap build ignores signals from outside
    // its sandbox, so it couldn't be stopped anyway. Later runs reuse it.
    spawn('geckodriver', ['--port', String(GECKO_PORT), '--profile-root', profileRoot], {
      stdio: 'ignore',
      detached: true,
    }).unref();
    for (let i = 0; !(await up()); i++) {
      if (i > 50) throw new Error('geckodriver did not start');
      await sleep(100);
    }
  }

  const { sessionId } = await call('POST', '/session', {
    capabilities: { alwaysMatch: { 'moz:firefoxOptions': { args: ['-headless'] } } },
  });
  try {
    await call('POST', `/session/${sessionId}/url`, { url });
    await call('POST', `/session/${sessionId}/execute/async`, {
      script:
        'const done = arguments[0]; const t = Date.now();' +
        '(function wait() { if (document.documentElement.dataset.ready || Date.now() - t > 10000) done(); else setTimeout(wait, 50); })();',
      args: [],
    });
    const pdf = await call('POST', `/session/${sessionId}/print`, {
      background: true,
      shrinkToFit: false,
      page: { width: 21, height: 29.7 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    writeFileSync(outPath, Buffer.from(pdf, 'base64'));
  } finally {
    await call('DELETE', `/session/${sessionId}`).catch(() => {});
  }
}

function printChromium() {
  const bin = process.env.CHROMIUM_BIN ?? 'brave';
  execFileSync(
    bin,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-pdf-header-footer',
      '--virtual-time-budget=3000',
      `--print-to-pdf=${outPath}`,
      url,
    ],
    { stdio: 'ignore', timeout: 90_000 },
  );
}

if (engine === 'firefox') await printFirefox();
else if (engine === 'chromium') printChromium();
else throw new Error(`unknown engine ${engine}`);
console.log(outPath);
process.exit(0);
