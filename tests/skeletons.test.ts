import { describe, expect, it } from 'vitest';
import type { SectionConfig } from '../src/model/types';
import { isInSidebar, SKELETONS, toggleSidebar } from '../src/templates/skeletons';

const sidebar = SKELETONS.sidebar;
const section = (id: SectionConfig['id'], extra: Partial<SectionConfig> = {}): SectionConfig => ({
  id,
  visible: true,
  ...extra,
});

describe('sidebar placement', () => {
  it('puts about, skills and languages in the sidebar by default', () => {
    expect(['about', 'skills', 'languages'].every((id) => isInSidebar(sidebar, section(id as SectionConfig['id'])))).toBe(true);
    expect(isInSidebar(sidebar, section('experience'))).toBe(false);
  });

  it('follows a per-section override', () => {
    expect(isInSidebar(sidebar, section('education', { sidebar: true }))).toBe(true);
    expect(isInSidebar(sidebar, section('languages', { sidebar: false }))).toBe(false);
  });

  it('never places anything in a sidebar on skeletons without one', () => {
    expect(isInSidebar(SKELETONS.single, section('skills', { sidebar: true }))).toBe(false);
  });

  it('toggles columns and drops the override when back at the default', () => {
    const moved = toggleSidebar(sidebar, section('education'));
    expect(moved).toEqual(section('education', { sidebar: true }));
    expect(toggleSidebar(sidebar, moved)).toEqual(section('education'));
    expect(toggleSidebar(sidebar, section('languages'))).toEqual(section('languages', { sidebar: false }));
  });
});
