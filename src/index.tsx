/* @refresh reload */

// Configure Monaco Editor environment BEFORE any imports
// This must be done before Monaco Editor is imported
self.MonacoEnvironment = {
  getWorker: function (_moduleId, _label) {
    const blob = new Blob([''], { type: 'text/json' });
    return new Worker(URL.createObjectURL(blob));
  }
};

import { render } from 'solid-js/web';
import { ErrorBoundary } from 'solid-js';

import App from './App';
import { StoreProvider } from 'services/Context';
import { Error } from 'components/error-page';
import { attachConsole } from '@tauri-apps/plugin-log';

attachConsole();

render(
  () => (
    <ErrorBoundary fallback={(err) => <Error err={err} />}>
      <StoreProvider>
        <App />
      </StoreProvider>
    </ErrorBoundary>
  ),
  document.getElementById('root') as HTMLElement
);
