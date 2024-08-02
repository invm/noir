/* @refresh reload */
import { render } from 'solid-js/web';
import 'solid-contextmenu/dist/style.css';
import { ErrorBoundary } from 'solid-js';

import App from './App';
import { StoreProvider } from 'services/Context';
import { Error } from 'components/Error';
import { attachConsole } from 'tauri-plugin-log-api';

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
