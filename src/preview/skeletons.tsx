import type { ComponentType } from 'react';
import type { CvDocument, SectionConfig } from '../model/types';
import { isInSidebar, SKELETONS, type SkeletonId } from '../templates/skeletons';
import { CvSection, IdentityBlock } from './parts';

export interface SkeletonProps {
  doc: CvDocument;
  /** Visible sections, in document order. */
  sections: SectionConfig[];
}

function renderSections(doc: CvDocument, sections: SectionConfig[]) {
  return sections.map((s) => <CvSection key={s.id} config={s} doc={doc} />);
}

function SidebarSkeleton({ doc, sections }: SkeletonProps) {
  const side = sections.filter((s) => isInSidebar(SKELETONS.sidebar, s));
  const main = sections.filter((s) => !isInSidebar(SKELETONS.sidebar, s));
  return (
    <>
      <div className="cv-fill cv-fill-page" />
      <div className="cv-fill cv-fill-sidebar" />
      <div className="cv-content">
        <aside className="cv-col cv-aside">
          <div className="cv-block">
            <IdentityBlock identity={doc.identity} />
          </div>
          {renderSections(doc, side)}
        </aside>
        <div className="cv-col cv-main">{renderSections(doc, main)}</div>
      </div>
    </>
  );
}

function SingleSkeleton({ doc, sections }: SkeletonProps) {
  return (
    <>
      <div className="cv-fill cv-fill-page" />
      <div className="cv-content">
        <div className="cv-col cv-main">
          <div className="cv-block">
            <IdentityBlock identity={doc.identity} />
          </div>
          {renderSections(doc, sections)}
        </div>
      </div>
    </>
  );
}

function HeaderBandSkeleton({ doc, sections }: SkeletonProps) {
  return (
    <>
      <div className="cv-fill cv-fill-page" />
      <div className="cv-content">
        <div className="cv-band">
          <IdentityBlock identity={doc.identity} />
        </div>
        <div className="cv-col cv-main">{renderSections(doc, sections)}</div>
      </div>
    </>
  );
}

export const SKELETON_COMPONENTS: Record<SkeletonId, ComponentType<SkeletonProps>> = {
  sidebar: SidebarSkeleton,
  single: SingleSkeleton,
  'header-band': HeaderBandSkeleton,
};
