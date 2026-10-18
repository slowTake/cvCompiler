import { describe, expect, it } from 'vitest';
import { contactHref, safeHref } from '../src/model/links';
import { moveItem } from '../src/model/list';
import { fileNameFor } from '../src/persistence/download';

describe('safeHref', () => {
  it('allows http(s), mailto and tel', () => {
    expect(safeHref('https://example.com')).toBe('https://example.com');
    expect(safeHref('mailto:a@example.com')).toBe('mailto:a@example.com');
    expect(safeHref('tel:+4670000')).toBe('tel:+4670000');
  });

  it('upgrades bare domains and refuses other schemes', () => {
    expect(safeHref('example.com/me')).toBe('https://example.com/me');
    expect(safeHref('javascript:alert(1)')).toBeUndefined();
    expect(safeHref('data:text/html,hi')).toBeUndefined();
    expect(safeHref('not a link')).toBeUndefined();
    expect(safeHref('  ')).toBeUndefined();
  });

  it('derives contact links from their kind', () => {
    expect(contactHref({ id: '1', kind: 'email', value: 'a@example.com' })).toBe('mailto:a@example.com');
    expect(contactHref({ id: '2', kind: 'phone', value: '+46 70 000 00 00' })).toBe('tel:+46700000000');
    expect(contactHref({ id: '3', kind: 'location', value: 'Oslo' })).toBeUndefined();
    expect(contactHref({ id: '4', kind: 'github', value: 'code.example.com/me' })).toBe(
      'https://code.example.com/me',
    );
    expect(contactHref({ id: '5', kind: 'other', value: 'x', href: 'javascript:void(0)' })).toBeUndefined();
  });
});

describe('list and file helpers', () => {
  it('moves items and clamps at the ends', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b']);
    expect(moveItem(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
    expect(moveItem(['a', 'b', 'c'], 2, 5)).toEqual(['a', 'b', 'c']);
  });

  it('makes file names from titles', () => {
    expect(fileNameFor('Mira Lindqvist CV')).toBe('mira-lindqvist-cv.json');
    expect(fileNameFor('Åsa Öberg — 2026')).toBe('asa-oberg-2026.json');
    expect(fileNameFor('   ')).toBe('cv.json');
  });
});
