import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { loadCachedDocument } from './persistence/cache';
import { demoDocument } from './persistence/initialData';
import './styles';
import { ToastProvider } from './ui/toast';

/** Browser cache first, then the demo CV. */
function initialDocument() {
  const cached = loadCachedDocument();
  if (cached) return cached;
  return { doc: demoDocument(), clean: true };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App initial={initialDocument()} />
    </ToastProvider>
  </StrictMode>,
);
