import { describe, expect, it } from 'vitest';
import { applyTagDraft, insertAt, splitTags } from '../src/model/list';

describe('insertAt', () => {
  it('reinserts at the original index, clamped to the current list', () => {
    expect(insertAt(['a', 'c'], 1, 'b')).toEqual(['a', 'b', 'c']);
    expect(insertAt(['a'], 5, 'z')).toEqual(['a', 'z']);
    expect(insertAt([], 2, 'x')).toEqual(['x']);
    expect(insertAt(['a'], -1, 'x')).toEqual(['x', 'a']);
  });
});

describe('tag drafts', () => {
  it('splits typed or pasted text on commas and newlines', () => {
    expect(splitTags(' React, TypeScript ,,\nCSS ')).toEqual(['React', 'TypeScript', 'CSS']);
    expect(splitTags('  ')).toEqual([]);
  });

  it('appends new tags without re-splitting existing ones', () => {
    const tags = ['Node.js, Deno', 'Go'];
    expect(applyTagDraft(tags, 'Rust, Zig', null)).toEqual(['Node.js, Deno', 'Go', 'Rust', 'Zig']);
    expect(applyTagDraft(tags, '', null)).toEqual(tags);
  });

  it('replaces the tag being edited as one tag, commas included', () => {
    const tags = ['Node.js, Deno', 'Go'];
    expect(applyTagDraft(tags, 'Node.js, Deno, Bun', 0)).toEqual(['Node.js, Deno, Bun', 'Go']);
    expect(applyTagDraft(tags, '  Golang ', 1)).toEqual(['Node.js, Deno', 'Golang']);
  });

  it('removes the edited tag when its draft is emptied', () => {
    expect(applyTagDraft(['a', 'b', 'c'], ' ', 1)).toEqual(['a', 'c']);
  });

  it('treats an out-of-range edit index as adding', () => {
    expect(applyTagDraft(['a'], 'b', 4)).toEqual(['a', 'b']);
  });
});
