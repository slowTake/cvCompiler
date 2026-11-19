import { createContext, useContext } from 'react';
import type { EditTarget } from '../model/editTarget';

interface EditFocus {
  /** The preview click still waiting to be shown in the form. */
  target: EditTarget | null;
  /** Called by whoever showed it, so a later remount doesn't jump again. */
  done: () => void;
}

export const EditFocusContext = createContext<EditFocus>({ target: null, done: () => {} });

export const useEditFocus = () => useContext(EditFocusContext);

const FLASH_CLASS = 'ui-flash';

/**
 * Brings `container` into view, focuses its input for `field` (or its first
 * text input), and flashes it so the eye lands in the right place.
 */
export function focusWithin(container: HTMLElement, field: string | undefined) {
  const input =
    (field && container.querySelector<HTMLElement>(`[data-field="${CSS.escape(field)}"]`)) ||
    container.querySelector<HTMLElement>('input, textarea');
  const flashed = input?.closest<HTMLElement>('.ui-field') ?? container;
  (input ?? container).scrollIntoView({ behavior: 'smooth', block: 'center' });
  input?.focus({ preventScroll: true });
  flashed.classList.remove(FLASH_CLASS);
  void flashed.offsetWidth; // restart the animation on repeat clicks
  flashed.classList.add(FLASH_CLASS);
}
