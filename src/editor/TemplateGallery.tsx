import { Check } from 'lucide-react';
import type { CvDocument } from '../model/types';
import { CvRenderer } from '../preview/CvRenderer';
import { PAGE_HEIGHT_PX, PAGE_WIDTH_PX } from '../preview/paginate';
import { TEMPLATES } from '../templates/registry';
import { SKELETON_IDS, SKELETONS } from '../templates/skeletons';
import { Modal } from '../ui/Modal';

const THUMB_WIDTH = 176;
const SCALE = THUMB_WIDTH / PAGE_WIDTH_PX;

interface Props {
  doc: CvDocument;
  onPick: (templateId: string) => void;
  onClose: () => void;
}

export function TemplateGallery({ doc, onPick, onClose }: Props) {
  const current = doc.meta.templateId;
  const overrideCount = Object.keys(doc.meta.style ?? {}).length;

  return (
    <Modal title="Choose a template" onClose={onClose} wide>
      <p className="ui-hint">
        Thumbnails show each template's own defaults with your content.
        {overrideCount > 0 &&
          ` Your ${overrideCount} style override${overrideCount === 1 ? '' : 's'} will still apply after switching.`}
      </p>
      {SKELETON_IDS.map((skeletonId) => {
        const templates = TEMPLATES.filter((t) => t.skeleton === skeletonId);
        if (templates.length === 0) return null;
        return (
          <section key={skeletonId} className="ui-gallery-group">
            <h3 className="ui-subhead">{SKELETONS[skeletonId].name}</h3>
            <p className="ui-hint">{SKELETONS[skeletonId].description}</p>
            <div className="ui-gallery">
              {templates.map((t) => {
                const selected = t.id === current;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`ui-gallery-card${selected ? ' is-selected' : ''}`}
                    aria-pressed={selected}
                    onClick={() => onPick(t.id)}
                  >
                    <span
                      className="ui-thumb"
                      style={{ width: THUMB_WIDTH, height: Math.round(PAGE_HEIGHT_PX * SCALE) }}
                      aria-hidden="true"
                    >
                      <span className="ui-thumb-inner" style={{ transform: `scale(${SCALE})` }} inert>
                        <CvRenderer doc={doc} template={t} />
                      </span>
                    </span>
                    <span className="ui-gallery-name">
                      {selected && <Check size={14} />} {t.name}
                    </span>
                    <span className="ui-gallery-desc">{t.description}</span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </Modal>
  );
}
