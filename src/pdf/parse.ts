/**
 * Text-parsing fallback for PDFs without embedded CV data: rebuilds a
 * CvDocument from the layout, and says where it was unsure.
 *
 * It leans on how CVs are typeset rather than on wording: section headings
 * share one style, entry titles share another, dates and locations sit in a
 * right-aligned segment, chips are short segments with wide gaps. Anything it
 * can't place is returned as `unplaced` text, never dropped.
 */
import { emptyDocument, SECTION_LABELS } from '../model/defaults';
import { newId } from '../model/id';
import type {
  ContactItem,
  ContactKind,
  CvDocument,
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  LinkItem,
  ProjectEntry,
  SectionConfig,
  SectionId,
  SkillGroup,
} from '../model/types';
import { SKELETONS } from '../templates/skeletons';
import type { PdfContent } from './content';
import { guessTemplate } from './guessTemplate';
import { buildLayout, type Line, type Region, type Segment } from './layout';

/** Something the person should check before loading. */
export interface ImportFlag {
  /** 'identity', or a section id. */
  section: 'identity' | SectionId;
  /** The entry or item the flag is about. */
  id?: string;
  /** The field, when it is about one field. */
  field?: string;
  message: string;
}

export interface UnplacedText {
  id: string;
  text: string;
  /** The heading it appeared under, when there was one. */
  heading?: string;
}

export interface ParsedCv {
  doc: CvDocument;
  flags: ImportFlag[];
  unplaced: UnplacedText[];
  /** Why the template was chosen, for the review screen. */
  templateReason: string;
}

// ---------------------------------------------------------------------------
// Text helpers

const BULLET = /^[›•▪‣●◦∙·*–—▸▹►▶➤✓✔→■□◆◇-]\s*/u;
const MONTH =
  '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spring|summer|autumn|fall|winter)\\.?';
const DATE = `(?:${MONTH}\\s+\\d{4}|\\d{4}[-/.]\\d{1,2}|\\d{1,2}[-/.]\\d{4}|\\d{4})`;
const OPEN_END = '(?:present|current|now|ongoing|today)';
// The range dash can go missing in extraction (Firefox drops the en dash glyph), so bare space separates too.
const DATE_RANGE = new RegExp(`^(${DATE})(?:(?:\\s*[–—-]\\s*|\\s+(?:to|until)\\s+|\\s+)(${DATE}|${OPEN_END}))?$`, 'iu');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const PHONE = /^\+?\d[\d\s().-]{6,}\d$/u;
const URLISH = /^(?:https?:\/\/)?(?:www\.)?[\w-]+(?:\.[\w-]+)+(?:\/\S*)?$/iu;
const ORG_WORDS = /\b(?:oy|oyj|ab|ltd|llc|inc|gmbh|corp(?:oration)?|company|labs?|group|agency)\b/iu;
const SCHOOL_WORDS =
  /\b(?:universit(?:y|ät|é|eit|à)|college|institute|school|academy|polytechnic|hochschule|yliopisto|ammattikorkeakoulu)\b/iu;
/** Separators between pieces typeset on one line: "Title · Org", "Title — Org". */
const PIECE_SEP = /\s+[·|•—]\s+/u;
/** An en dash separates pieces too ("Acme – Engineer"), except inside a date range. */
const EN_DASH_SEP = /\s+–\s+/u;
const ROLE_WORDS =
  /\b(?:engineer|developer|designer|manager|lead|consultant|analyst|intern|trainee|architect|scientist|specialist|director|officer|assistant|coordinator|administrator|founder|teacher|researcher|programmer|technician)\b/iu;
/** Separators inside a run of chips written as text. */
const LIST_SEP = /\s*(?:,|·|•|\|)\s*/u;
const CHIP_LABEL = /^(?:skills developed|tech(?:nologies)?|tools|stack|skills)\s*:?\s*/iu;

export function parseDateRange(text: string): { start?: string; end?: string } | null {
  const m = DATE_RANGE.exec(text.trim());
  if (!m) return null;
  return { start: m[1], end: m[2] ? capitalise(m[2]) : undefined };
}

function capitalise(text: string): string {
  return /^\p{Ll}/u.test(text) ? text[0].toUpperCase() + text.slice(1) : text;
}

/** "MIRA LINDQVIST" → "Mira Lindqvist"; anything with lower case stays as is. */
function unshout(text: string): string {
  if (!/\p{Lu}/u.test(text) || /\p{Ll}/u.test(text)) return text;
  return text.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

const squash = (text: string) => text.toLowerCase().replace(/[^\p{L}]/gu, '');
const style = (l: { font: string; size: number }) => `${l.font}@${Math.round(l.size * 4) / 4}`;
const isBullet = (text: string) => BULLET.test(text) && text.replace(BULLET, '').length > 0;
const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;
const listItems = (text: string) =>
  text
    .split(LIST_SEP)
    .map((t) => t.trim())
    .filter(Boolean);

/** Joins wrapped lines; a line ending in a hyphen joins without a space. */
function joinWrapped(parts: string[]): string {
  return parts.reduce((acc, p) => (acc === '' ? p : acc.endsWith('-') ? acc + p : `${acc} ${p}`), '');
}

/** The style used for the most characters. */
function dominantStyle(segments: Segment[]): string {
  const chars = new Map<string, number>();
  for (const s of segments) for (const sp of s.spans) chars.set(style(sp), (chars.get(style(sp)) ?? 0) + sp.text.length);
  return [...chars.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
}

// ---------------------------------------------------------------------------
// Section headings

const HEADING_KEYWORDS: [SectionId, string[]][] = [
  ['languages', ['languages', 'language', 'kielet', 'kielitaito', 'sprachen', 'språk', 'langues']],
  ['experience', ['experience', 'employment', 'workhistory', 'career', 'positions', 'työkokemus', 'berufserfahrung', 'erfarenhet']],
  ['projects', ['projects', 'project', 'projektit', 'projekte', 'projekt', 'portfolio']],
  ['education', ['education', 'academic', 'qualifications', 'studies', 'koulutus', 'ausbildung', 'utbildning', 'certifications']],
  ['skills', ['skills', 'skill', 'competenc', 'technolog', 'toolkit', 'expertise', 'taidot', 'kenntnisse', 'kompetens']],
  ['about', ['about', 'profile', 'summary', 'objective', 'introduction', 'personalstatement', 'profiili', 'profil']],
];

function headingSection(text: string): SectionId | null {
  const key = squash(text);
  if (key.length === 0 || key.length > 32) return null;
  for (const [id, words] of HEADING_KEYWORDS) {
    if (words.some((w) => key === w || key.endsWith(w) || key.startsWith(w))) return id;
  }
  return null;
}

const looksLikeHeading = (l: Line) =>
  l.segments.length === 1 &&
  l.text.length <= 40 &&
  !/[.:,;]$/u.test(l.text) &&
  !parseDateRange(l.text) &&
  wordCount(l.text) <= 5;

/**
 * Heading lines: lines in the style most keyword headings share. Without a
 * shared style, keyword lines that are set apart (all caps, or larger).
 */
function findHeadings(lines: Line[], bodySize: number): Set<Line> {
  const candidates = lines.filter((l) => looksLikeHeading(l) && headingSection(l.text));
  const counts = new Map<string, number>();
  for (const l of candidates) counts.set(style(l), (counts.get(style(l)) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const headingStyle = top && top[1] >= 2 ? top[0] : null;
  const headings = new Set<Line>();
  for (const l of lines) {
    if (!looksLikeHeading(l)) continue;
    if (headingStyle) {
      if (style(l) === headingStyle) headings.add(l);
    } else if (headingSection(l.text) && (l.text === l.text.toUpperCase() || l.size > bodySize * 1.15)) {
      headings.add(l);
    }
  }
  return headings;
}

/** A heading as typed, or as close as can be told from all-caps text. */
function headingTitle(text: string, id: SectionId): string | undefined {
  if (squash(text) === squash(SECTION_LABELS[id])) return undefined;
  const t = text.trim();
  return t === t.toUpperCase() ? capitalise(t.toLowerCase()) : t;
}

// ---------------------------------------------------------------------------
// Identity

function hrefFits(text: string, href: string | undefined): boolean {
  if (!href) return false;
  if (href.startsWith('mailto:')) return text.includes('@');
  if (href.startsWith('tel:')) return PHONE.test(text);
  const t = squash(text);
  return t.length >= 4 && squash(href).includes(t);
}

const bareUrl = (u: string) => u.replace(/^https?:\/\/(www\.)?/u, '').replace(/\/$/u, '');

function contactFor(text: string, href: string | undefined): { contact?: ContactItem; link?: LinkItem } {
  let value = text.trim();
  // Glyphs can go missing in extraction (Firefox drops "//"); the link target still has them.
  if (href && /^https?:/u.test(href) && squash(href) === squash(value)) value = href;
  const id = newId();
  const fromHref = (): ContactKind | null => {
    if (!href) return null;
    if (href.startsWith('mailto:')) return 'email';
    if (href.startsWith('tel:')) return 'phone';
    if (/linkedin\.com/iu.test(href)) return 'linkedin';
    if (/github\.com/iu.test(href)) return 'github';
    return null;
  };
  const kind: ContactKind | null =
    fromHref() ??
    (EMAIL.test(value)
      ? 'email'
      : PHONE.test(value)
        ? 'phone'
        : /linkedin\.com/iu.test(value)
          ? 'linkedin'
          : /github\.com/iu.test(value)
            ? 'github'
            : URLISH.test(value)
              ? 'website'
              : null);
  if (kind) {
    // Likewise "+" in a phone number; the tel: link keeps it.
    if (kind === 'phone' && href?.startsWith('tel:+') && !value.startsWith('+')) value = `+${value}`;
    // Keep the link target only when the text alone wouldn't rebuild it.
    const keepHref = href && /^https?:/u.test(href) && bareUrl(href) !== bareUrl(value);
    return { contact: { id, kind, value, ...(keepHref ? { href } : {}) } };
  }
  if (href && /^https?:/u.test(href)) return { link: { id, url: href, label: value } };
  if (/^[\p{L} .'()-]+,\s*[\p{L} .'()-]+$/u.test(value) && value.length <= 48) {
    return { contact: { id, kind: 'location', value } };
  }
  return { contact: { id, kind: 'other', value } };
}

// ---------------------------------------------------------------------------
// Entries (experience, projects, education)

interface RawEntry {
  title: string[];
  titleHref?: string;
  org: string[];
  dates?: { start?: string; end?: string };
  location?: string;
  /** Description as "- " bullet lines and paragraphs, like the data model. */
  description: string[];
  chips: string[];
  extra: string[];
}

interface Piece {
  text: string;
  /** First piece of the line. */
  lead: boolean;
  /** Sits right of the column's middle. */
  right: boolean;
  href?: string;
}

/** The widest gap between a line's segments. */
const maxGap = (l: Line) => Math.max(0, ...l.segments.slice(1).map((s, i) => s.x - l.segments[i].right));

function splitEntries(lines: Line[], bodyStyle: string) {
  const left = Math.min(...lines.map((l) => l.x));
  const right = Math.max(...lines.map((l) => l.right));
  const mid = (left + right) / 2;
  const first = lines.find((l) => !isBullet(l.text));
  const titleStyle = first ? style(first) : null;
  const titleStyleFound = !!titleStyle && titleStyle !== bodyStyle;

  const chipish = (l: Line) => {
    if (style(l) === titleStyle || l.segments.some((s) => parseDateRange(s.text))) return false;
    if (CHIP_LABEL.test(l.text) && /^skills developed/iu.test(l.text)) return true;
    if (l.segments.length >= 2) {
      return maxGap(l) <= l.size * 3 && l.segments.every((s) => wordCount(s.text) <= 4);
    }
    const items = listItems(l.text);
    return style(l) !== bodyStyle && items.length >= 2 && items.every((t) => wordCount(t) <= 4 && !parseDateRange(t));
  };
  const chipStyles = new Set(lines.filter(chipish).map(style));
  const isChips = (l: Line) =>
    chipish(l) || (chipStyles.has(style(l)) && style(l) !== bodyStyle && l.segments.length === 1 && l.text.length <= 30);
  const chipsOf = (l: Line) =>
    l.segments.flatMap((s, i) => listItems(i === 0 ? s.text.replace(CHIP_LABEL, '') : s.text));

  const piecesOf = (l: Line): Piece[] =>
    l.segments.flatMap((s, si) =>
      s.text
        .split(PIECE_SEP)
        .flatMap((t) => (parseDateRange(t) ? [t] : t.split(EN_DASH_SEP)))
        .map((text, pi) => ({
        // A separator can start a segment when an icon before it was dropped ("Name ↗ · Role").
        text: text.replace(/^[·|•—/]\s*/u, '').trim(),
        lead: si === 0 && pi === 0,
        right: s.x > mid,
        href: pi === 0 ? s.href : undefined,
      })),
    );

  const entries: RawEntry[] = [];
  let cur: RawEntry | null = null;
  let phase: 'head' | 'body' = 'head';
  let prev: Line | null = null;
  let bulletX = 0;
  let lineGap = 0;

  for (const l of lines) {
    const startsEntry = titleStyleFound
      ? style(l) === titleStyle && !(phase === 'head' && prev && style(prev) === titleStyle)
      : phase === 'body' && l.segments.some((s) => parseDateRange(s.text));
    if (!cur || startsEntry) {
      cur = { title: [], org: [], description: [], chips: [], extra: [] };
      entries.push(cur);
      phase = 'head';
    }
    const gap = prev && prev.page === l.page ? l.y - prev.y : 0;

    if (phase === 'head' && !isBullet(l.text) && !isChips(l)) {
      // Dates and locations, wherever they sit on the line.
      const text: Piece[] = [];
      let afterDate = false;
      const pieces = piecesOf(l);
      for (const p of pieces) {
        const dates = parseDateRange(p.text);
        if (dates && !cur.dates) {
          cur.dates = dates;
          afterDate = true;
          continue;
        }
        const placeLike = p.text.length <= 40 && !/[.!?]$/u.test(p.text);
        if (!cur.location && placeLike && (afterDate || (p.right && (!p.lead || pieces.length === 1)))) {
          cur.location = p.text;
          continue;
        }
        afterDate = false;
        text.push(p);
      }

      if (text.length === 0) {
        prev = l;
        continue;
      }
      const isTitleLine = titleStyleFound ? style(l) === titleStyle : cur.title.length === 0;
      const [lead, ...rest] = text;
      const short = l.text.length <= 70 && !/[.!?]$/u.test(l.text);
      if (isTitleLine && cur.org.length === 0) {
        cur.title.push(lead.text);
        cur.titleHref ??= lead.href;
        // "Title — Org" on one line.
        if (rest.length > 0) cur.org.push(rest.shift()!.text);
        cur.extra.push(...rest.map((p) => p.text));
        prev = l;
        continue;
      }
      // In body style, only a line well short of the column edge; wrapped paragraph lines run to it.
      const narrow = l.right - left < (right - left) * 0.75;
      if (cur.org.length === 0 && cur.title.length > 0 && (style(l) !== bodyStyle || (short && narrow))) {
        cur.org.push(lead.text);
        cur.extra.push(...rest.map((p) => p.text));
        prev = l;
        continue;
      }
      phase = 'body';
    }
    phase = 'body';

    if (isChips(l)) {
      cur.chips.push(...chipsOf(l));
    } else if (isBullet(l.text)) {
      cur.description.push(`- ${l.text.replace(BULLET, '')}`);
      bulletX = l.segments[0].x;
    } else {
      const last = cur.description[cur.description.length - 1];
      // Indented lines with no bullet glyph are list items whose markers were
      // drawn as shapes (Chromium draws list bullets that way). A line that ran
      // to the column edge wraps into the next one.
      const indented = l.x > left + 6;
      const ranToEdge = !!prev && prev.right > right - (right - left) * 0.12;
      const continuesBullet = last?.startsWith('- ') && (bulletX ? l.x > bulletX + 1 : indented && ranToEdge);
      const typicalGap = lineGap || l.size * 1.5;
      if (last !== undefined && (continuesBullet || (gap > 0 && gap <= typicalGap * 1.3 && !last.startsWith('- ') && !indented))) {
        cur.description[cur.description.length - 1] = joinWrapped([last, l.text]);
      } else if (indented && !bulletX) {
        cur.description.push(`- ${l.text}`);
      } else {
        if (last !== undefined) cur.description.push('');
        cur.description.push(l.text);
      }
    }
    if (gap > 0 && (lineGap === 0 || gap < lineGap)) lineGap = gap;
    prev = l;
  }

  // A first "entry" without a title is stray text above the first entry.
  const leftover: string[] = [];
  if (entries[0] && entries[0].title.length === 0 && entries[0].org.length === 0 && !entries[0].dates) {
    const stray = entries.shift()!;
    leftover.push(...stray.description.filter(Boolean), ...stray.chips, ...stray.extra);
  }
  return { entries, leftover, titleStyleFound };
}

const descriptionText = (lines: string[]) =>
  lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    // Bullets are separated by single newlines; paragraphs by blank lines.
    .replace(/\n\n(?=- )/g, '\n')
    .trim() || undefined;

// ---------------------------------------------------------------------------

interface Section {
  id: SectionId | null;
  heading: string;
  region: Region;
  lines: Line[];
}

type AddUnplaced = (text: string, heading?: string) => void;

export function parsePdfContent(content: PdfContent): ParsedCv {
  const { lines, sidebar } = buildLayout(content);
  const doc = emptyDocument();
  const flags: ImportFlag[] = [];
  const unplaced: UnplacedText[] = [];
  const addUnplaced: AddUnplaced = (text, heading) => {
    if (text.trim()) unplaced.push({ id: newId(), text: text.trim(), heading });
  };

  const bodyStyle = dominantStyle(lines.flatMap((l) => l.segments));
  const bodySize = Number(bodyStyle.split('@')[1]) || 10;

  // --- Split into preamble and sections. Each column keeps its own current
  // section; on later pages, text before any heading continues the last one.
  const headings = findHeadings(lines, bodySize);
  const preamble: Line[] = [];
  const sections: Section[] = [];
  const current = new Map<Region, Section>();
  for (const l of lines) {
    if (headings.has(l)) {
      const section: Section = { id: headingSection(l.text), heading: l.text, region: l.region, lines: [] };
      sections.push(section);
      current.set(l.region, section);
      continue;
    }
    const section = current.get(l.region) ?? current.get('full') ?? (l.page > 0 ? sections[sections.length - 1] : undefined);
    if (section) section.lines.push(l);
    else preamble.push(l);
  }

  parseIdentity(preamble, doc, flags, bodySize);

  // --- Sections
  const found: SectionConfig[] = [];
  for (const section of sections) {
    const { id, heading } = section;
    if (!id) {
      // A heading the data model has no section for: keep its text for the review.
      for (const l of section.lines) addUnplaced(l.text, heading);
      continue;
    }
    // A second heading of a known kind ("Skills", then "Tools") adds to the first.
    if (!found.some((f) => f.id === id)) {
      const config: SectionConfig = { id, visible: true };
      const title = headingTitle(heading, id);
      if (title) config.title = title;
      if (sidebar) {
        const inSide = section.region === 'side';
        const skeleton = SKELETONS[sidebar.side === 'right' ? 'sidebar-right' : 'sidebar'];
        if (inSide !== skeleton.sidebarSections.includes(id)) config.sidebar = inSide;
      }
      found.push(config);
    }
    parseSection(id, section.lines, doc, flags, addUnplaced, bodyStyle, heading);
  }
  if (sections.length === 0) {
    flags.push({ section: 'identity', message: 'No section headings found, so the text below is unsorted.' });
  }
  const missing = doc.meta.sections.filter((s) => !found.some((f) => f.id === s.id)).map((s) => ({ ...s, visible: false }));
  doc.meta.sections = [...found, ...missing];

  const nameLine = preamble.find((l) => l.text && doc.identity.name.startsWith(unshout(l.text)));
  const guess = guessTemplate(lines, sidebar, nameLine);
  doc.meta.templateId = guess.templateId;
  if (guess.style) doc.meta.style = guess.style;

  return { doc, flags, unplaced, templateReason: guess.reason };
}

/** Name (the largest text), role (just below it), contacts and links. */
function parseIdentity(preamble: Line[], doc: CvDocument, flags: ImportFlag[], bodySize: number): void {
  const nameLine = [...preamble].sort((a, b) => b.size - a.size)[0];
  if (!nameLine) {
    flags.push({ section: 'identity', field: 'name', message: "Couldn't find a name." });
    return;
  }
  // A long name may wrap onto a second line in the same style.
  const nameLines = [nameLine];
  for (const l of preamble) {
    const last = nameLines[nameLines.length - 1];
    if (l !== last && style(l) === style(nameLine) && l.page === last.page && l.y > last.y && l.y - last.y < l.size * 1.6) {
      nameLines.push(l);
    }
  }
  doc.identity.name = unshout(nameLines.map((l) => l.text).join(' '));
  doc.meta.title = `${doc.identity.name} CV`;
  if (nameLine.size < bodySize * 1.2) {
    flags.push({ section: 'identity', field: 'name', message: 'Name guessed from the first line; check it.' });
  }

  const rest = preamble.filter((l) => !nameLines.includes(l));
  const nameBottom = nameLines[nameLines.length - 1];
  const roleLine = rest.find(
    (l) =>
      l.page === nameBottom.page &&
      l.y > nameBottom.y &&
      l.y - nameBottom.y < nameBottom.size * 2.5 &&
      l.segments.length === 1 &&
      contactFor(l.text, l.segments[0].href).contact?.kind === 'other',
  );
  if (roleLine) doc.identity.role = roleLine.text;

  for (const l of rest) {
    if (l === roleLine) continue;
    if (l.text.length > 90) {
      // A summary above the first heading.
      doc.identity.about = joinWrapped([doc.identity.about ?? '', l.text]).trim();
      continue;
    }
    for (const seg of l.segments) {
      // "a | b | c" in one segment: separate contacts.
      const parts = seg.text.split(/\s+[|·•]\s+/u);
      for (const part of parts) {
        // One link under a row of contacts belongs to the part it matches.
        const href = parts.length === 1 || hrefFits(part, seg.href) ? seg.href : undefined;
        const { contact, link } = contactFor(part, href);
        if (link) (doc.identity.links ??= []).push(link);
        if (!contact) continue;
        doc.identity.contact.push(contact);
        if (contact.kind === 'other') {
          flags.push({ section: 'identity', id: contact.id, message: `Not sure what "${part}" is, so it's saved as Other.` });
        }
      }
    }
  }
}

function parseSection(
  id: SectionId,
  lines: Line[],
  doc: CvDocument,
  flags: ImportFlag[],
  addUnplaced: AddUnplaced,
  bodyStyle: string,
  heading: string,
): void {
  if (lines.length === 0) return;
  switch (id) {
    case 'about':
      return parseAbout(lines, doc);
    case 'skills':
      return parseSkills(lines, doc, flags);
    case 'languages':
      return parseLanguages(lines, doc);
    default:
      return parseEntries(id, lines, doc, flags, addUnplaced, bodyStyle, heading);
  }
}

function parseAbout(lines: Line[], doc: CvDocument): void {
  const gaps = lines
    .slice(1)
    .map((l, i) => (l.page === lines[i].page ? l.y - lines[i].y : 0))
    .filter((g) => g > 0);
  const lineGap = gaps.length ? Math.min(...gaps) : 0;
  const paragraphs: string[][] = [[]];
  lines.forEach((l, i) => {
    const prev = lines[i - 1];
    if (prev && prev.page === l.page && lineGap && l.y - prev.y > lineGap * 1.3) paragraphs.push([]);
    paragraphs[paragraphs.length - 1].push(l.text);
  });
  const about = paragraphs.map(joinWrapped).filter(Boolean).join('\n\n');
  doc.identity.about = doc.identity.about ? `${doc.identity.about}\n\n${about}` : about;
}

function parseSkills(lines: Line[], doc: CvDocument, flags: ImportFlag[]): void {
  const chipStyle = dominantStyle(lines.flatMap((l) => l.segments));
  const startGroup = (name: string) => {
    const group: SkillGroup = { id: newId(), name: name.replace(/:$/u, '').trim(), items: [] };
    doc.skills.push(group);
    return group;
  };
  let group: SkillGroup | null = null;
  for (const l of lines) {
    const [first, ...others] = l.segments;
    let chips: Segment[] = l.segments;
    if (first.text.endsWith(':') || (others.length > 0 && style(first) !== chipStyle)) {
      // "Frontend: a, b" or a group label in its own style, then chips.
      group = startGroup(first.text);
      chips = others;
    } else if (others.length === 0 && style(first) !== chipStyle && listItems(first.text).length <= 1) {
      group = startGroup(first.text);
      continue;
    }
    for (const seg of chips) {
      const m = /^([^:]{2,40}):\s+(.+)$/u.exec(seg.text);
      if (m) group = startGroup(m[1]);
      group ??= startGroup('');
      group.items.push(...listItems(m ? m[2] : seg.text));
    }
  }
  for (const g of doc.skills) {
    if (!g.name && doc.skills.length > 1) flags.push({ section: 'skills', id: g.id, message: 'Skill group without a name.' });
  }
}

/**
 * Names and levels, told apart by style ("Swedish" bold, "Native" regular),
 * by segment ("Swedish ... Native"), or by a separator ("Swedish – native").
 */
function parseLanguages(lines: Line[], doc: CvDocument): void {
  const spans = lines.flatMap((l) => l.segments.flatMap((s) => s.spans));
  const nameStyle = style(spans[0]);
  const styled = spans.some((s) => style(s) !== nameStyle);
  for (const l of lines) {
    if (!styled) {
      // One style throughout: "name  level" as two segments, else one language per segment.
      if (l.segments.length === 2) {
        doc.languages.push({ id: newId(), name: l.segments[0].text, level: l.segments[1].text });
      } else {
        for (const seg of l.segments) doc.languages.push({ id: newId(), name: seg.text });
      }
      continue;
    }
    let cur: LanguageEntry | null = null;
    for (const span of l.segments.flatMap((s) => s.spans)) {
      if (style(span) === nameStyle || !cur) {
        if (!cur || cur.level !== undefined) {
          cur = { id: newId(), name: span.text };
          doc.languages.push(cur);
        } else {
          cur.name += ` ${span.text}`;
        }
      } else {
        cur.level = cur.level ? `${cur.level} ${span.text}` : span.text;
      }
    }
  }
  for (const entry of doc.languages) {
    if (entry.level) continue;
    const m = /^(.+?)\s*(?:[–—:-]\s*|\()(.+?)\)?$/u.exec(entry.name);
    if (m) [entry.name, entry.level] = [m[1].trim(), m[2].trim()];
  }
}

function parseEntries(
  id: 'experience' | 'projects' | 'education',
  lines: Line[],
  doc: CvDocument,
  flags: ImportFlag[],
  addUnplaced: AddUnplaced,
  bodyStyle: string,
  heading: string,
): void {
  const { entries, leftover, titleStyleFound } = splitEntries(lines, bodyStyle);
  for (const t of leftover) addUnplaced(t, heading);
  const hasSlash = (raw: RawEntry) => raw.org.length === 0 && / \/ /u.test(joinWrapped(raw.title));
  // Every entry written "Title / Org" is a layout convention, not a guess worth flagging.
  const slashConvention = entries.length >= 2 && entries.every(hasSlash);
  for (const raw of entries) {
    const entryId = newId();
    let title = joinWrapped(raw.title);
    let org = joinWrapped(raw.org);
    // "Title / Org" with no separate org line. Kept as a last resort, since
    // titles like "UX / UI Designer" use the same separator.
    if (!org && / \/ /u.test(title)) {
      [title, org] = title.split(/ \/ (.*)/su).map((t) => t.trim()) as [string, string];
      if (!slashConvention) {
        flags.push({ section: id, id: entryId, field: 'org', message: `Split "${title} / ${org}" into two fields; check it.` });
      }
    }
    const description = descriptionText(raw.description);
    const flag = (field: string | undefined, message: string) => flags.push({ section: id, id: entryId, field, message });
    for (const t of raw.extra) addUnplaced(t, heading);
    if (!titleStyleFound) flag(undefined, 'Entries were split at their dates; check where each one starts.');
    if (!raw.dates) flag('start', 'No dates found.');

    if (id === 'experience') {
      const orgFirst =
        (ORG_WORDS.test(title) && !ORG_WORDS.test(org)) || (ROLE_WORDS.test(org) && !ROLE_WORDS.test(title));
      if (org && orgFirst) {
        [title, org] = [org, title];
        flag('title', 'Swapped job title and company; check they are the right way round.');
      }
      if (!org) flag('org', 'No company found.');
      const entry: ExperienceEntry = {
        id: entryId,
        title,
        org,
        ...raw.dates,
        ...(raw.location ? { location: raw.location } : {}),
        ...(description ? { description } : {}),
        ...(raw.chips.length ? { skills: raw.chips } : {}),
      };
      doc.experience.push(entry);
    } else if (id === 'projects') {
      const entry: ProjectEntry = {
        id: entryId,
        name: title,
        ...(org ? { role: org } : {}),
        ...raw.dates,
        ...(raw.titleHref ? { url: raw.titleHref } : {}),
        ...(description ? { description } : {}),
        ...(raw.chips.length ? { tech: raw.chips } : {}),
      };
      if (raw.location) addUnplaced(raw.location, heading);
      doc.projects.push(entry);
    } else {
      let degree: string | undefined = title;
      let institution = org;
      if (!institution) {
        institution = title;
        degree = undefined;
      } else if (SCHOOL_WORDS.test(title) && !SCHOOL_WORDS.test(org)) {
        [degree, institution] = [org, title];
      }
      const details = [...raw.description.filter(Boolean).map((d) => d.replace(/^- /u, '')), ...raw.chips];
      const entry: EducationEntry = {
        id: entryId,
        institution,
        ...(degree ? { degree } : {}),
        ...raw.dates,
        ...(raw.location ? { location: raw.location } : {}),
        ...(details.length ? { details } : {}),
      };
      doc.education.push(entry);
    }
  }
}
