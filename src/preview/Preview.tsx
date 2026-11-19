import { Maximize2, Minus, Plus } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { editTargetAt, type EditTarget } from '../model/editTarget';
import type { CvDocument } from '../model/types';
import { loadUiState, saveUiState } from '../persistence/cache';
import { getTemplate } from '../templates/registry';
import { CvRenderer } from './CvRenderer';
import { PAGE_HEIGHT_PX, PAGE_WIDTH_PX, paginate } from './paginate';

type Zoom = 'fit' | number;
const ZOOM_STEPS = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.5];
const GUTTER = 32;

export function Preview({ doc, onEdit }: { doc: CvDocument; onEdit?: (target: EditTarget) => void }) {
  const template = getTemplate(doc.meta.templateId);
  const sheetRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(1);
  const [zoom, setZoom] = useState<Zoom>(() => loadUiState<Zoom>('zoom', 'fit'));
  const [fitScale, setFitScale] = useState(0.8);

  useEffect(() => saveUiState('zoom', zoom), [zoom]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width - GUTTER * 2;
      setFitScale(Math.max(0.3, Math.min(1.5, width / PAGE_WIDTH_PX)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Bundled fonts load on first use and change line widths, so measure again.
  const [fontsLoaded, setFontsLoaded] = useState(0);
  useEffect(() => {
    const onLoaded = () => setFontsLoaded((n) => n + 1);
    document.fonts.addEventListener('loadingdone', onLoaded);
    return () => document.fonts.removeEventListener('loadingdone', onLoaded);
  }, []);

  // Content, template and style (all inside doc) move page breaks.
  useLayoutEffect(() => {
    if (!sheetRef.current) return;
    const count = paginate(sheetRef.current);
    setPages((prev) => (prev === count ? prev : count));
  }, [doc, fontsLoaded]);

  // Clicking the CV opens what was clicked in the form. Links still open with Ctrl/⌘.
  const onSheetClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!onEdit || !(e.target instanceof Element)) return;
    const link = e.target.closest('a');
    if (link && (e.metaKey || e.ctrlKey)) return;
    if (window.getSelection()?.toString()) return; // selecting text, not clicking
    const target = editTargetAt(e.target);
    if (link) e.preventDefault();
    if (target) onEdit(target);
  };

  const scale = zoom === 'fit' ? fitScale : zoom;
  const step = (dir: 1 | -1) => {
    const current = scale;
    const lower = ZOOM_STEPS.filter((z) => z < current - 0.001);
    const next = dir > 0 ? ZOOM_STEPS.find((z) => z > current + 0.001) : lower[lower.length - 1];
    setZoom(next ?? (dir > 0 ? ZOOM_STEPS[ZOOM_STEPS.length - 1] : ZOOM_STEPS[0]));
  };

  return (
    <div className="ui-preview">
      <div className="ui-preview-bar">
        <span className="ui-hint">
          A4 · {pages} page{pages === 1 ? '' : 's'}
        </span>
        <div className="ui-preview-zoom">
          <button type="button" className="ui-icon-btn" aria-label="Zoom out" onClick={() => step(-1)}>
            <Minus size={15} />
          </button>
          <span className="ui-zoom-value">{Math.round(scale * 100)}%</span>
          <button type="button" className="ui-icon-btn" aria-label="Zoom in" onClick={() => step(1)}>
            <Plus size={15} />
          </button>
          <button
            type="button"
            className={`ui-btn ui-btn-small${zoom === 'fit' ? ' is-active' : ''}`}
            onClick={() => setZoom('fit')}
            title="Fit page width"
          >
            <Maximize2 size={13} /> Fit
          </button>
        </div>
      </div>
      <div className="ui-preview-viewport" ref={viewportRef}>
        <div
          className="ui-sheet-frame"
          style={{ width: PAGE_WIDTH_PX * scale, height: PAGE_HEIGHT_PX * pages * scale }}
        >
          <div
            className={`ui-sheet-scale${onEdit ? ' is-editable' : ''}`}
            style={{ transform: `scale(${scale})` }}
            onClick={onSheetClick}
          >
            <CvRenderer
              doc={doc}
              template={template}
              overrides={doc.meta.style}
              pages={pages}
              pageRef={sheetRef}
            />
            {Array.from({ length: pages - 1 }, (_, i) => (
              <div key={i} className="ui-page-break" style={{ top: PAGE_HEIGHT_PX * (i + 1) }} aria-hidden="true">
                <span>Page {i + 2}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
