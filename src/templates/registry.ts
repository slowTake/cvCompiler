/**
 * Template registry. A template is a LayoutSkeleton × Theme:
 *
 *   - `skeleton` picks one of the layout components in src/preview/skeletons.
 *   - `defaults` are the template's values for every user-overridable knob.
 *   - Everything else about the look lives in a CSS token block,
 *     `.cv-theme-<id> { --cv-…: … }`, in src/templates/themes/<id>.css.
 *
 * Adding a template on an existing skeleton = one entry here + one CSS file.
 * Theme files are picked up automatically (see themes/index.ts).
 */
import type { ResolvedStyle } from '../model/style';
import type { SkeletonId } from './skeletons';

export interface TemplateDef {
  /** Stable id stored in documents; also the theme class suffix. [a-z0-9-] only. */
  id: string;
  name: string;
  description: string;
  skeleton: SkeletonId;
  /** Where the accent colour is drawn, for the contrast warning. Defaults to the page. */
  accentOn?: 'sidebar';
  defaults: ResolvedStyle;
}

export const TEMPLATES: readonly TemplateDef[] = [
  {
    id: 'studio',
    name: 'Studio',
    description: 'Monospace, soft pink accents, capped headers on a light accent bar.',
    skeleton: 'sidebar',
    defaults: {
      accent: '#d4537e',
      fontPairing: 'mono',
      density: 'normal',
      headerCase: 'upper',
      sidebarWidth: 40,
      typeScale: 100,
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Cool blue-grey sidebar, clean sans-serif, understated rules.',
    skeleton: 'sidebar',
    defaults: {
      accent: '#3b6ea8',
      fontPairing: 'sans',
      density: 'normal',
      headerCase: 'upper',
      sidebarWidth: 34,
      typeScale: 100,
    },
  },
  {
    id: 'nocturne',
    name: 'Nocturne',
    description: 'Deep ink sidebar with light text and a bright accent.',
    skeleton: 'sidebar',
    defaults: {
      accent: '#c0811f',
      fontPairing: 'technical',
      density: 'normal',
      headerCase: 'upper',
      sidebarWidth: 36,
      typeScale: 100,
    },
  },
  {
    id: 'fern',
    name: 'Fern',
    description: 'Editorial serif headings, green accents, airy spacing.',
    skeleton: 'sidebar',
    defaults: {
      accent: '#3f7d58',
      fontPairing: 'editorial',
      density: 'roomy',
      headerCase: 'normal',
      sidebarWidth: 32,
      typeScale: 100,
    },
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Plain serif, black on white, no icons. The safest ATS choice.',
    skeleton: 'single',
    defaults: {
      accent: '#1f1f1f',
      fontPairing: 'serif',
      density: 'normal',
      headerCase: 'upper',
      sidebarWidth: 40,
      typeScale: 100,
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Quiet sans-serif with hairline rules and dates under titles.',
    skeleton: 'single',
    defaults: {
      accent: '#5b5f97',
      fontPairing: 'sans',
      density: 'normal',
      headerCase: 'normal',
      sidebarWidth: 40,
      typeScale: 100,
    },
  },
  {
    id: 'ledger',
    name: 'Ledger',
    description: 'Monospace headings over a sans body, teal markers, compact.',
    skeleton: 'single',
    defaults: {
      accent: '#127a7a',
      fontPairing: 'technical',
      density: 'compact',
      headerCase: 'upper',
      sidebarWidth: 40,
      typeScale: 100,
    },
  },
  {
    id: 'harbor',
    name: 'Harbor',
    description: 'Navy header band, crisp sans-serif body.',
    skeleton: 'header-band',
    defaults: {
      accent: '#1f4e8c',
      fontPairing: 'sans',
      density: 'normal',
      headerCase: 'upper',
      sidebarWidth: 40,
      typeScale: 100,
    },
  },
  {
    id: 'sunrise',
    name: 'Sunrise',
    description: 'Warm coral band with editorial serif headings.',
    skeleton: 'header-band',
    defaults: {
      accent: '#c4553a',
      fontPairing: 'editorial',
      density: 'normal',
      headerCase: 'normal',
      sidebarWidth: 40,
      typeScale: 100,
    },
  },
  {
    id: 'graphite',
    name: 'Graphite',
    description: 'Charcoal band, monospace headings, lime highlights.',
    skeleton: 'header-band',
    defaults: {
      accent: '#5f8a1c',
      fontPairing: 'technical',
      density: 'normal',
      headerCase: 'upper',
      sidebarWidth: 40,
      typeScale: 100,
    },
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    description: 'Cream page, warm brown sidebar, serif headings.',
    skeleton: 'sidebar',
    defaults: {
      accent: '#b5532f',
      fontPairing: 'editorial',
      density: 'normal',
      headerCase: 'normal',
      sidebarWidth: 35,
      typeScale: 100,
    },
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Dense serif, small-caps headings, no colour. Prints well in black and white.',
    skeleton: 'single',
    defaults: {
      accent: '#1f1f1f',
      fontPairing: 'serif',
      density: 'compact',
      headerCase: 'normal',
      sidebarWidth: 40,
      typeScale: 100,
    },
  },
  {
    id: 'swiss',
    name: 'Swiss',
    description: 'Big grotesk name, one hard accent, flush-left grid and plenty of air.',
    skeleton: 'single',
    defaults: {
      accent: '#d6001c',
      fontPairing: 'sans',
      density: 'roomy',
      headerCase: 'normal',
      sidebarWidth: 40,
      typeScale: 100,
    },
  },
  {
    id: 'centred',
    name: 'Centred',
    description: 'Name and headings centred over hairlines, skills as a quiet inline list.',
    skeleton: 'single',
    defaults: {
      accent: '#2f6f6a',
      fontPairing: 'editorial',
      density: 'normal',
      headerCase: 'normal',
      sidebarWidth: 40,
      typeScale: 100,
    },
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    description: 'Light grey page, mono labels, boxed skills under a pale band.',
    skeleton: 'header-band',
    defaults: {
      accent: '#2c5aa0',
      fontPairing: 'technical',
      density: 'normal',
      headerCase: 'upper',
      sidebarWidth: 40,
      typeScale: 100,
    },
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'A vertical rail with a dot for every role, school and project.',
    skeleton: 'timeline',
    defaults: {
      accent: '#3b6ea8',
      fontPairing: 'sans',
      density: 'normal',
      headerCase: 'upper',
      sidebarWidth: 40,
      typeScale: 100,
    },
  },
  {
    id: 'journal',
    name: 'Journal',
    description: 'Section labels in a narrow left column, content in a wide right one.',
    skeleton: 'split',
    defaults: {
      accent: '#8a4b2a',
      fontPairing: 'sans',
      density: 'normal',
      headerCase: 'upper',
      sidebarWidth: 40,
      typeScale: 100,
    },
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    description: 'Pale page with a rounded slate card on the right and a heavy upper-case name.',
    skeleton: 'sidebar-right',
    defaults: {
      accent: '#4a5160',
      fontPairing: 'sans',
      density: 'normal',
      headerCase: 'upper',
      sidebarWidth: 32,
      typeScale: 100,
    },
  },
  {
    id: 'paper',
    name: 'Paper',
    description: 'Soft grey page, plain headings and a narrow details column on the right.',
    skeleton: 'sidebar-right',
    defaults: {
      accent: '#4b5563',
      fontPairing: 'sans',
      density: 'normal',
      headerCase: 'normal',
      sidebarWidth: 30,
      typeScale: 100,
    },
  },
  {
    id: 'cocoa',
    name: 'Cocoa',
    description: 'Light sidebar with brown ribbon headings beside a dark main column.',
    skeleton: 'sidebar',
    accentOn: 'sidebar',
    defaults: {
      accent: '#8c6552',
      fontPairing: 'sans',
      density: 'normal',
      headerCase: 'upper',
      sidebarWidth: 36,
      typeScale: 100,
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    description: 'Near-black page, copper accents, pill-shaped skills and a heavy name.',
    skeleton: 'sidebar',
    defaults: {
      accent: '#b87333',
      fontPairing: 'sans',
      density: 'normal',
      headerCase: 'upper',
      sidebarWidth: 36,
      typeScale: 100,
    },
  },
  {
    id: 'volt',
    name: 'Volt',
    description: 'Charcoal page with electric lime headings and mono labels.',
    skeleton: 'sidebar',
    defaults: {
      accent: '#5a8f1e',
      fontPairing: 'technical',
      density: 'normal',
      headerCase: 'upper',
      sidebarWidth: 36,
      typeScale: 100,
    },
  },
  {
    id: 'console',
    name: 'Console',
    description: 'Dark mono page with boxed skills and hairline panels.',
    skeleton: 'header-band',
    defaults: {
      accent: '#2f8f78',
      fontPairing: 'mono',
      density: 'normal',
      headerCase: 'upper',
      sidebarWidth: 40,
      typeScale: 100,
    },
  },
];

export const DEFAULT_TEMPLATE_ID = 'studio';

const BY_ID: ReadonlyMap<string, TemplateDef> = new Map(TEMPLATES.map((t) => [t.id, t]));

export const DEFAULT_TEMPLATE: TemplateDef = BY_ID.get(DEFAULT_TEMPLATE_ID)!;

export function hasTemplate(id: string): boolean {
  return BY_ID.has(id);
}

export function findTemplate(id: string): TemplateDef | undefined {
  return BY_ID.get(id);
}

/** Looks a template up by id, falling back to the default template. */
export function getTemplate(id: string | undefined): TemplateDef {
  return (id !== undefined && BY_ID.get(id)) || DEFAULT_TEMPLATE;
}

export function themeClass(template: TemplateDef): string {
  return `cv-theme-${template.id}`;
}
