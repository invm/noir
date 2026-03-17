import { createEffect, createSignal, on, Show } from 'solid-js';
import { useAppSelector } from 'services/Context';
import { Results } from './QueryTab/Results';

const DataTab = () => {
  const {
    connections: { getContentData, getConnection },
    app: { gridTheme },
  } = useAppSelector();
  const [live, setLive] = createSignal(true);

  createEffect(on(() => getConnection().idx, () => {
    setLive(false);
    queueMicrotask(() => setLive(true));
  }, { defer: true }));

  return (
    <Show when={live()}>
      <Results editable={true} gridTheme={gridTheme()} table={getContentData('Data').table} />
    </Show>
  );
};

export { DataTab };
