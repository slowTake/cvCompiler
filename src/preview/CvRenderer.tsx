import type { CSSProperties, Ref } from 'react';
import { resolveStyle, styleToCssVars } from '../model/style';
import type { CvDocument, StyleOverrides } from '../model/types';
import { themeClass, type TemplateDef } from '../templates/registry';
import { SKELETON_COMPONENTS } from './skeletons';

export interface CvRendererProps {
  doc: CvDocument;
  template: TemplateDef;
  /** User overrides; pass undefined to render the template's own defaults. */
  overrides?: StyleOverrides;
  /** On-screen sheet height in A4 pages (the preview grows it to fit). */
  pages?: number;
  pageRef?: Ref<HTMLDivElement>;
}

/** Renders a CV as an A4 sheet. Reads only --cv-* tokens; knows nothing about the editor. */
export function CvRenderer({ doc, template, overrides, pages = 1, pageRef }: CvRendererProps) {
  const style = resolveStyle(template.defaults, overrides);
  const Skeleton = SKELETON_COMPONENTS[template.skeleton];
  const sections = doc.meta.sections.filter((s) => s.visible);
  const inline = {
    ...styleToCssVars(style),
    minHeight: `calc(297mm * ${pages})`,
  } as CSSProperties;

  return (
    <div
      ref={pageRef}
      className={`cv-page cv-skeleton-${template.skeleton} ${themeClass(template)}`}
      style={inline}
      lang="en"
    >
      <Skeleton doc={doc} sections={sections} />
    </div>
  );
}
