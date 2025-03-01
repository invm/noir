/* @refresh reload */
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
