/**
 * PDF round trip in real browsers: prints the demo CV in every template with
 * Firefox and with Chromium (Brave), then imports each PDF the way the app
 * does and checks the result.
 *
 *   npm run dev            # in another terminal
 *   npm run e2e:pdf [-- --engines firefox,chromium --templates studio,classic --fixtures --reuse]
 *
 * Needs geckodriver + Firefox, and Brave or Chromium (CHROMIUM_BIN). PDFs and
 * extracted text land in e2e-output/ (git-ignored). --fixtures also copies
 * the extracted content into tests/fixtures/pdf/ for the unit tests.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { serializeCv } from '../src/model/normalize';
import { visibleOnly } from '../src/pdf/embed';
import { importPdfContent } from '../src/pdf/importPdf';
import { demoDocument } from '../src/persistence/initialData';
import { TEMPLATES } from '../src/templates/registry';
import { readPdfNode } from '../tests/helpers/nodePdf';
import { scoreParse } from '../tests/helpers/scoreParse';

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const engines = (arg('engines') ?? 'firefox,chromium').split(',');
const templates = (arg('templates') ?? TEMPLATES.map((t) => t.id).join(',')).split(',');
const hide = arg('hide') ?? '';
const writeFixtures = process.argv.includes('--fixtures');
/** Skip printing when the PDF is already there; for working on the parser. */
const reuse = process.argv.includes('--reuse');
const base = arg('base') ?? 'http://localhost:5173';

const out = path.resolve('e2e-output');
const fixtures = path.resolve('tests/fixtures/pdf');
mkdirSync(out, { recursive: true });

let failures = 0;
const rows: string[] = [];

for (const engine of engines) {
  for (const template of templates) {
    const name = `${engine}-${template}${hide ? `-hide-${hide.replace(/,/g, '+')}` : ''}`;
    const pdfPath = path.join(out, `${name}.pdf`);
    const url = `${base}/e2e/print.html?template=${template}${hide ? `&hide=${hide}` : ''}`;
    if (!reuse || !existsSync(pdfPath)) {
      execFileSync('node', ['scripts/print-pdf.mjs', engine, url, pdfPath], { stdio: 'ignore' });
    }

    const content = await readPdfNode(new Uint8Array(readFileSync(pdfPath)));
    writeFileSync(path.join(out, `${name}.json`), JSON.stringify(content));

    const expected = demoDocument();
    expected.meta.templateId = template;
    const hidden = new Set(hide.split(',').filter(Boolean));
    expected.meta.sections = expected.meta.sections.map((s) => (hidden.has(s.id) ? { ...s, visible: false } : s));

    // 1. Embedded data: exact restore, not flagged as modified.
    const embedded = await importPdfContent(content);
    const exact =
      embedded.kind === 'embedded' && serializeCv(embedded.doc) === serializeCv(visibleOnly(expected));
    const clean = embedded.kind === 'embedded' && !embedded.modified;

    // 2. The text-parsing fallback, with the embed ignored.
    const parsed = await importPdfContent(content, { ignoreEmbed: true });
    const score = parsed.kind === 'parsed' ? scoreParse(parsed.result, visibleOnly(expected)) : null;

    const ok = exact && clean && !!score && score.pass;
    if (!ok) failures++;
    rows.push(
      `${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(22)} embed:${exact ? 'exact' : 'MISMATCH'}${clean ? '' : ' (flagged modified)'}  parse:${
        score ? `${Math.round(score.ratio * 100)}%${score.pass ? '' : ` [${score.misses.slice(0, 4).join('; ')}]`}` : 'n/a'
      }`,
    );
    if (writeFixtures) {
      mkdirSync(fixtures, { recursive: true });
      writeFileSync(path.join(fixtures, `${name}.json`), JSON.stringify(content));
    }
  }
}

// A CV typeset elsewhere (e2e/external-cv.html): no embed, so it must go to the review.
for (const engine of engines) {
  const name = `external-${engine}`;
  const pdfPath = path.join(out, `${name}.pdf`);
  if (!reuse || !existsSync(pdfPath)) {
    execFileSync('node', ['scripts/print-pdf.mjs', engine, `${base}/e2e/external-cv.html`, pdfPath], { stdio: 'ignore' });
  }
  const content = await readPdfNode(new Uint8Array(readFileSync(pdfPath)));
  const result = await importPdfContent(content);
  const ok = result.kind === 'parsed' && result.result.doc.experience.length === 2;
  if (!ok) failures++;
  rows.push(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(22)} ${result.kind}`);
  if (writeFixtures) writeFileSync(path.join(fixtures, `${name}.json`), JSON.stringify(content));
}

// A PDF edited after export: the embed must be flagged as no longer matching.
for (const engine of engines) {
  const pdfPath = path.join(out, `${engine}-tampered.pdf`);
  if (!reuse || !existsSync(pdfPath)) {
    execFileSync('node', ['scripts/print-pdf.mjs', engine, `${base}/e2e/print.html?template=studio&tamper=1`, pdfPath], {
      stdio: 'ignore',
    });
  }
  const result = await importPdfContent(await readPdfNode(new Uint8Array(readFileSync(pdfPath))));
  const flagged = result.kind === 'embedded' && result.modified;
  if (!flagged) failures++;
  rows.push(`${flagged ? 'PASS' : 'FAIL'}  ${`${engine}-tampered`.padEnd(22)} ${flagged ? 'flagged as edited after export' : 'NOT flagged'}`);
}

console.log(rows.join('\n'));
console.log(failures ? `\n${failures} failed` : '\nall passed');
process.exit(failures ? 1 : 0);
