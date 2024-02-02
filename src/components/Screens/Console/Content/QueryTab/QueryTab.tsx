import { Results } from './Results';
import { createEffect, onCleanup, Show } from 'solid-js';
import Split from 'split.js';
import { Editor } from './Editor';
import { useAppSelector } from 'services/Context';

export const QueryTab = () => {
  createEffect(() => {
    const q = Split(['#query', '#results'], {
      sizes: [30, 70],
      minSize: [200, 400],
      maxSize: [500, Infinity],
      direction: 'vertical',
      gutterSize: 4,
    });

    onCleanup(() => q.destroy());
  });

  const {
    app: { gridTheme, editorTheme },
  } = useAppSelector();

  return (
    <div class="flex flex-col h-full">
      <div id="query" class="flex flex-col">
        <Show when={editorTheme()} keyed>
          {(_) => <Editor editorTheme={editorTheme()} />}
        </Show>
      </div>
      <div id="results">
        <Show when={editorTheme()} keyed>
          {(_) => <Results editable={false} gridTheme={gridTheme()} editorTheme={editorTheme()} />}
        </Show>
      </div>
    </div>
  );
};
