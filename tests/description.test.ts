import { describe, expect, it } from 'vitest';
import { descriptionFrom, parseDescription } from '../src/model/description';

describe('parseDescription', () => {
  it('reads plain text as paragraphs split by blank lines', () => {
    expect(parseDescription('First line\nsame paragraph\n\nSecond')).toEqual([
      { kind: 'paragraph', text: 'First line\nsame paragraph' },
      { kind: 'paragraph', text: 'Second' },
    ]);
  });

  it('reads -, * and • lines as one bullet list', () => {
    expect(parseDescription('- one\n* two\n  • three')).toEqual([{ kind: 'bullets', items: ['one', 'two', 'three'] }]);
  });

  it('keeps paragraphs and bullets in written order', () => {
    expect(parseDescription('Intro\n- a\n- b\nOutro\n\n- c')).toEqual([
      { kind: 'paragraph', text: 'Intro' },
      { kind: 'bullets', items: ['a', 'b'] },
      { kind: 'paragraph', text: 'Outro' },
      { kind: 'bullets', items: ['c'] },
    ]);
  });

  it('does not treat hyphenated words or empty bullets as bullets', () => {
    expect(parseDescription('-5% cost\n- \nwell-known')).toEqual([
      { kind: 'paragraph', text: '-5% cost' },
      { kind: 'paragraph', text: 'well-known' },
    ]);
  });

  it('returns nothing for empty or missing text', () => {
    expect(parseDescription(undefined)).toEqual([]);
    expect(parseDescription(' \n\n ')).toEqual([]);
  });
});

describe('descriptionFrom', () => {
  it('puts the summary first, then bullet lines', () => {
    expect(descriptionFrom(' Summary ', ['a', ' ', 'b'])).toBe('Summary\n\n- a\n- b');
    expect(descriptionFrom(undefined, ['a'])).toBe('- a');
    expect(descriptionFrom('Only', undefined)).toBe('Only');
    expect(descriptionFrom(undefined, [])).toBe('');
  });
});
