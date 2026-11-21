import { describe, expect, it } from 'vitest';
import { guessTemplate } from '../src/pdf/guessTemplate';
import type { Line } from '../src/pdf/layout';
import { getTemplate } from '../src/templates/registry';

const line = (text: string, color: string): Line => ({
  text,
  segments: [{ text, color } as Line['segments'][number]],
  x: 0,
  right: 100,
  y: 20,
  page: 0,
  region: 'full',
  size: 10,
  font: 'sans',
  color,
});

describe('guessTemplate', () => {
  const dark = line('Name', '#202020');
  const orange = [line('Experience', '#d9822b')];

  it('maps a right-hand sidebar to a right-sidebar template', () => {
    const guess = guessTemplate(orange, { side: 'right', widthPercent: 32 }, dark);
    expect(getTemplate(guess.templateId).skeleton).toBe('sidebar-right');
  });

  it('never matches a light PDF to a dark-page template', () => {
    for (const sidebar of [undefined, { side: 'left' as const, widthPercent: 36 }]) {
      const guess = guessTemplate(orange, sidebar, dark);
      expect(getTemplate(guess.templateId).dark, guess.templateId).toBeFalsy();
    }
  });

  it('keeps matching a dark sidebar when the name is light', () => {
    const guess = guessTemplate(orange, { side: 'left', widthPercent: 36 }, line('Name', '#ffffff'));
    expect(guess.templateId).toBe('nocturne');
  });
});
