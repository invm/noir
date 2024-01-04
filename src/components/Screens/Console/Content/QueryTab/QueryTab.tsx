import { ResultsTable } from './ResultesTable';
import { createEffect, onCleanup } from 'solid-js';
import Split from 'split.js';
import { Editor } from './Editor';

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

  return (
    <div class="flex flex-col h-full">
      <div id="query" class="flex flex-col">
        <Editor />
      </div>
      <div id="results">
        <ResultsTable />
      </div>
    </div>
  );
};
