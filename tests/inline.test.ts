import { describe, expect, it } from 'vitest';
import { applyEdit, parseInline, toggleBold } from '../src/model/inline';

describe('parseInline', () => {
  it('splits **bold** spans out of plain text', () => {
    expect(parseInline('Built **three** tools in **2024**.')).toEqual([
      { text: 'Built ', bold: false },
      { text: 'three', bold: true },
      { text: ' tools in ', bold: false },
      { text: '2024', bold: true },
      { text: '.', bold: false },
    ]);
  });

  it('leaves unpaired, empty or space-padded markers as typed', () => {
    for (const text of ['5 ** 2', '****', '** not bold **', 'a **b']) {
      expect(parseInline(text)).toEqual([{ text, bold: false }]);
    }
  });

  it('allows bold text with spaces and line breaks inside', () => {
    expect(parseInline('**Lead\nengineer**')).toEqual([{ text: 'Lead\nengineer', bold: true }]);
  });

  it('returns nothing for empty text', () => {
    expect(parseInline('')).toEqual([]);
  });
});

describe('toggleBold', () => {
  const run = (text: string, start: number, end: number) => {
    const edit = toggleBold(text, start, end);
    const next = applyEdit(text, edit);
    return { next, selected: next.slice(edit.selStart, edit.selEnd) };
  };

  it('wraps the selection and keeps it selected', () => {
    expect(run('Built three tools', 6, 11)).toEqual({ next: 'Built **three** tools', selected: 'three' });
  });

  it('keeps spaces at the selection edges outside the markers', () => {
    expect(run('Built three tools', 5, 12)).toEqual({ next: 'Built **three** tools', selected: 'three' });
  });

  it('unwraps a selection that includes the markers', () => {
    expect(run('Built **three** tools', 6, 15)).toEqual({ next: 'Built three tools', selected: 'three' });
  });

  it('unwraps when the markers sit just outside the selection', () => {
    expect(run('Built **three** tools', 8, 13)).toEqual({ next: 'Built three tools', selected: 'three' });
  });

  it('inserts an empty pair with the caret between when nothing is selected', () => {
    const edit = toggleBold('ab', 1, 1);
    expect(applyEdit('ab', edit)).toBe('a****b');
    expect([edit.selStart, edit.selEnd]).toEqual([3, 3]);
  });
});
