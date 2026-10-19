import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio, hexToRgb } from '../src/model/color';
import { sanitizeStyle } from '../src/model/style';
import {
  DEFAULT_TEMPLATE,
  DEFAULT_TEMPLATE_ID,
  TEMPLATES,
  findTemplate,
  getTemplate,
  hasTemplate,
  themeClass,
} from '../src/templates/registry';
import { SKELETON_IDS, SKELETONS } from '../src/templates/skeletons';

const root = join(__dirname, '..');
const themesDir = join(root, 'src/templates/themes');
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('template lookup', () => {
  it('finds templates by id', () => {
    expect(getTemplate('slate').name).toBe('Slate');
    expect(findTemplate('harbor')?.skeleton).toBe('header-band');
    expect(hasTemplate('classic')).toBe(true);
  });

  it('falls back to the default template for unknown ids', () => {
    expect(getTemplate('does-not-exist')).toBe(DEFAULT_TEMPLATE);
    expect(getTemplate(undefined)).toBe(DEFAULT_TEMPLATE);
    expect(getTemplate('')).toBe(DEFAULT_TEMPLATE);
    expect(findTemplate('does-not-exist')).toBeUndefined();
    expect(hasTemplate('toString')).toBe(false);
  });

  it('defaults to Studio: sidebar, mono, upper-case headers', () => {
    expect(DEFAULT_TEMPLATE_ID).toBe('studio');
    expect(DEFAULT_TEMPLATE.name).toBe('Studio');
    expect(DEFAULT_TEMPLATE.skeleton).toBe('sidebar');
    expect(DEFAULT_TEMPLATE.defaults.fontPairing).toBe('mono');
    expect(DEFAULT_TEMPLATE.defaults.headerCase).toBe('upper');
  });

  it('builds the theme class from the id', () => {
    expect(themeClass(getTemplate('fern'))).toBe('cv-theme-fern');
  });
});

describe('registry integrity', () => {
  it('ships about ten templates covering every skeleton', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(9);
    for (const skeleton of SKELETON_IDS) {
      expect(TEMPLATES.some((t) => t.skeleton === skeleton)).toBe(true);
      expect(SKELETONS[skeleton].id).toBe(skeleton);
    }
  });

  it('has unique, CSS-safe ids', () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('declares complete, valid defaults for every knob', () => {
    for (const t of TEMPLATES) {
      expect(sanitizeStyle(t.defaults), t.id).toEqual(t.defaults);
    }
  });

  it('gives every template an accent with at least 3:1 contrast on white', () => {
    const white = { r: 255, g: 255, b: 255 };
    for (const t of TEMPLATES) {
      expect(contrastRatio(hexToRgb(t.defaults.accent)!, white), t.id).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('theme token blocks', () => {
  const files = readdirSync(themesDir).filter((f) => f.endsWith('.css'));

  it('has one theme file per template, defining its class', () => {
    for (const t of TEMPLATES) {
      const file = `${t.id}.css`;
      expect(files, `missing src/templates/themes/${file}`).toContain(file);
      const css = readFileSync(join(themesDir, file), 'utf8');
      expect(css).toContain(`.${themeClass(t)}`);
    }
    expect(files).toHaveLength(TEMPLATES.length);
  });

  it('theme files contain only --cv-* custom properties', () => {
    for (const file of files) {
      const css = stripComments(readFileSync(join(themesDir, file), 'utf8'));
      const selectors = [...css.matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim());
      expect(selectors, file).toEqual([`.cv-theme-${file.replace(/\.css$/, '')}`]);
      const body = css.slice(css.indexOf('{') + 1, css.lastIndexOf('}'));
      const props = body
        .split(';')
        .map((d) => d.trim())
        .filter(Boolean)
        .map((d) => d.slice(0, d.indexOf(':')).trim());
      expect(props.length, file).toBeGreaterThan(0);
      for (const prop of props) expect(prop, `${file}: ${prop}`).toMatch(/^--cv-[a-z0-9-]+$/);
    }
  });

  it('keeps CV and editor tokens apart', () => {
    const cv = stripComments(readFileSync(join(root, 'src/styles/cv.css'), 'utf8'));
    const ui = stripComments(readFileSync(join(root, 'src/styles/ui.css'), 'utf8'));
    expect(cv).not.toMatch(/--ui-/);
    expect(ui).not.toMatch(/--cv-/);
    // The CV stylesheet reads only --cv-* variables.
    const vars = [...cv.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]);
    expect(vars.length).toBeGreaterThan(0);
    for (const v of vars) expect(v).toMatch(/^--cv-/);
  });
});
