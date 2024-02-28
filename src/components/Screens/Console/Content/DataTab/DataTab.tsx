import { useAppSelector } from 'services/Context';
import { Results } from '../QueryTab/Results';
import { Show } from 'solid-js';

const DataTab = () => {
  const {
    connections: { getContentData },
    app: { gridTheme, editorTheme },
  } = useAppSelector();
  return (
    <Show when={editorTheme()} keyed>
      {(_) => (
        <Results
          editable={true}
          gridTheme={gridTheme()}
          table={getContentData('Data').table}
          editorTheme={editorTheme()}
        />
      )}
    </Show>
  );
};

export { DataTab };
