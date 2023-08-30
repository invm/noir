import Split from "split.js";
import { createEffect, onCleanup } from "solid-js";
import { Sidebar } from "components/Screens/Console/Sidebar/Sidebar";
import { Content } from "components/Screens/Console/Content/Content";

export const Console = () => {
  createEffect(() => {
    const s = Split(["#sidebar", "#main"], {
      sizes: [20, 80],
      minSize: [100, 200],
      maxSize: [400, Infinity],
      gutterSize: 6,
    });
    onCleanup(() => {
      s.destroy();
    });
  });

  return (
    <div class="w-full h-full bg-base-300">
      <div class="flex w-full h-full">
        <div id="sidebar" class="h-full">
          <div class="bg-base-200 w-full h-full rounded-tr-lg">
            <Sidebar />
          </div>
        </div>
        <div id="main">
          <Content />
        </div>
      </div>
    </div>
  );
};
