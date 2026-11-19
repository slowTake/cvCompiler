/**
 * What a click on the preview asks the editor to show. The renderer marks
 * elements with data-edit-section / data-edit-entry / data-edit-field; the
 * field names match the CvDocument keys and the form's `field` props.
 */
export interface EditTarget {
  /** Form section id: 'identity', 'projects', 'experience', … */
  section: string;
  entryId?: string;
  field?: string;
  /** Distinguishes two clicks on the same spot. */
  nonce: number;
}

/** The field name of a section's rename box in Document & sections. */
export const sectionTitleField = (sectionId: string) => `section-title-${sectionId}`;

let nonce = 0;

/** Reads the edit target under a clicked element, or null when there is none. */
export function editTargetAt(el: Element): EditTarget | null {
  const sectionEl = el.closest<HTMLElement>('[data-edit-section]');
  if (!sectionEl) return null;
  const entryEl = el.closest<HTMLElement>('[data-edit-entry]');
  const entry = entryEl && sectionEl.contains(entryEl) ? entryEl : null;
  const fieldEl = el.closest<HTMLElement>('[data-edit-field]');
  const scope = entry ?? sectionEl;
  const field = fieldEl && scope.contains(fieldEl) ? fieldEl.dataset.editField : undefined;
  return {
    section: sectionEl.dataset.editSection!,
    entryId: entry?.dataset.editEntry,
    field,
    nonce: ++nonce,
  };
}
