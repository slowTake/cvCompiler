import { describe, expect, it } from 'vitest';
import { contrastRatio, hexToRgb, normalizeHex, parseCssColor } from '../src/model/color';
import { resolveStyle, sanitizeStyle, setOverride, styleToCssVars } from '../src/model/style';
import { getTemplate } from '../src/templates/registry';

describe('sanitizeStyle', () => {
  it('returns undefined for non-objects and empty results', () => {
    expect(sanitizeStyle(undefined)).toBeUndefined();
    expect(sanitizeStyle('mono')).toBeUndefined();
    expect(sanitizeStyle([])).toBeUndefined();
    expect(sanitizeStyle({})).toBeUndefined();
    expect(sanitizeStyle({ accent: 'red', density: 'tight' })).toBeUndefined();
  });

  it('keeps every valid field', () => {
    const input = {
      accent: '#aa3366',
      fontPairing: 'editorial',
      density: 'compact',
      headerCase: 'normal',
      sidebarWidth: 35,
      typeScale: 110,
    };
    expect(sanitizeStyle(input)).toEqual(input);
  });

  it('normalises accent colours to lowercase #rrggbb', () => {
    expect(sanitizeStyle({ accent: '#AA3366' })).toEqual({ accent: '#aa3366' });
    expect(sanitizeStyle({ accent: '#a36' })).toEqual({ accent: '#aa3366' });
    expect(sanitizeStyle({ accent: ' #aa3366 ' })).toEqual({ accent: '#aa3366' });
  });

  it('drops invalid values field by field', () => {
    expect(
      sanitizeStyle({
        accent: 'rgb(1,2,3)',
        fontPairing: 'comic',
        density: 'normal',
        headerCase: 'UPPER',
        sidebarWidth: '40%',
        typeScale: Number.NaN,
        extra: 1,
      }),
    ).toEqual({ density: 'normal' });
  });

  it('clamps and rounds numeric ranges', () => {
    expect(sanitizeStyle({ sidebarWidth: 10, typeScale: 300 })).toEqual({ sidebarWidth: 30, typeScale: 145 });
    expect(sanitizeStyle({ sidebarWidth: 70, typeScale: 20 })).toEqual({ sidebarWidth: 50, typeScale: 80 });
    expect(sanitizeStyle({ sidebarWidth: 41.6 })).toEqual({ sidebarWidth: 42 });
    expect(sanitizeStyle({ typeScale: Number.POSITIVE_INFINITY })).toBeUndefined();
  });
});

describe('resolveStyle / setOverride', () => {
  const studio = getTemplate('studio');

  it('uses template defaults for missing fields', () => {
    expect(resolveStyle(studio.defaults, undefined)).toEqual(studio.defaults);
    expect(resolveStyle(studio.defaults, { density: 'roomy' })).toEqual({ ...studio.defaults, density: 'roomy' });
  });

  it('keeps overrides across template switches', () => {
    const overrides = { accent: '#123456', typeScale: 90 };
    const slate = getTemplate('slate');
    const resolved = resolveStyle(slate.defaults, overrides);
    expect(resolved.accent).toBe('#123456');
    expect(resolved.typeScale).toBe(90);
    expect(resolved.fontPairing).toBe(slate.defaults.fontPairing);
  });

  it('ignores invalid overrides at resolve time', () => {
    const resolved = resolveStyle(studio.defaults, { accent: 'nope' } as never);
    expect(resolved.accent).toBe(studio.defaults.accent);
  });

  it('sets and clears single overrides, collapsing to undefined', () => {
    const one = setOverride(undefined, 'density', 'compact');
    expect(one).toEqual({ density: 'compact' });
    const two = setOverride(one, 'accent', '#ABCDEF');
    expect(two).toEqual({ density: 'compact', accent: '#abcdef' });
    expect(setOverride(setOverride(two, 'density', undefined), 'accent', undefined)).toBeUndefined();
  });

  it('clears an override set back to the template value', () => {
    const raised = setOverride(undefined, 'typeScale', 120, studio.defaults);
    expect(raised).toEqual({ typeScale: 120 });
    expect(setOverride(raised, 'typeScale', studio.defaults.typeScale, studio.defaults)).toBeUndefined();
    const both = setOverride({ density: 'roomy' }, 'fontPairing', studio.defaults.fontPairing, studio.defaults);
    expect(both).toEqual({ density: 'roomy' });
    // Without defaults, an explicit value is always kept.
    expect(setOverride(undefined, 'typeScale', 100)).toEqual({ typeScale: 100 });
  });

  it('drops invalid values passed to setOverride', () => {
    expect(setOverride({ density: 'compact' }, 'accent', 'pink', studio.defaults)).toEqual({ density: 'compact' });
  });

  it('turns a resolved style into --cv-* custom properties only', () => {
    const vars = styleToCssVars({ ...studio.defaults, sidebarWidth: 33, typeScale: 120, headerCase: 'normal' });
    expect(Object.keys(vars).every((k) => k.startsWith('--cv-'))).toBe(true);
    expect(vars['--cv-sidebar-width']).toBe('33%');
    expect(vars['--cv-type-scale']).toBe('1.2');
    expect(vars['--cv-heading-transform']).toBe('none');
    expect(vars['--cv-accent']).toBe(studio.defaults.accent);
  });
});

describe('colour helpers', () => {
  it('parses hex and computed CSS colours', () => {
    expect(normalizeHex('#FFF')).toBe('#ffffff');
    expect(normalizeHex('fff')).toBeUndefined();
    expect(hexToRgb('#102030')).toEqual({ r: 16, g: 32, b: 48 });
    expect(parseCssColor('rgb(255, 250, 240)')).toEqual({ r: 255, g: 250, b: 240 });
    expect(parseCssColor('rgba(1 2 3 / 0.5)')).toEqual({ r: 1, g: 2, b: 3 });
    expect(parseCssColor('color(srgb 1 0.5 0)')).toEqual({ r: 255, g: 128, b: 0 });
    expect(parseCssColor('papayawhip')).toBeUndefined();
  });

  it('computes WCAG contrast ratios', () => {
    const white = { r: 255, g: 255, b: 255 };
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, white)).toBeCloseTo(21, 5);
    expect(contrastRatio(white, white)).toBeCloseTo(1, 5);
    // #767676 is the classic 4.5:1 grey on white.
    expect(contrastRatio(hexToRgb('#767676')!, white)).toBeCloseTo(4.54, 1);
  });
});
