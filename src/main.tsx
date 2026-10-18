import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { loadCachedDocument } from './persistence/cache';
import { demoDocument, loadPrivateDocument } from './persistence/initialData';
import './styles/ui.css';
import './styles/cv.css';
import './templates/themes';
import './styles/print.css';
import { ToastProvider } from './ui/toast';

/** Browser cache first, then (dev only) data/cv.private.json, then the demo. */
async function initialDocument() {
  const cached = loadCachedDocument();
  if (cached) return cached;
  const privateDoc = await loadPrivateDocument();
  return { doc: privateDoc ?? demoDocument(), clean: true };
}

void initialDocument().then((initial) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ToastProvider>
        <App initial={initial} />
      </ToastProvider>
    </StrictMode>,
  );
});
