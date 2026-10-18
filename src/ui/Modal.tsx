import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export function Modal({ title, onClose, children, wide }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className={`ui-modal${wide ? ' ui-modal-wide' : ''}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ui-modal-body">
        <header className="ui-modal-head">
          <h2>{title}</h2>
          <button type="button" className="ui-icon-btn" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
