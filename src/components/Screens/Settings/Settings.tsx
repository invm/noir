import { ThemeSwitch } from "components/UI/ThemeSwitch";
import { useAppSelector } from "services/Context";

export const Settings = () => {
  const {
    connections: { clearStore },
  } = useAppSelector();

  return (
    <div class="p-4 bg-base-300 flex-1">
      <h1 class="text-2xl font-bold">Settings</h1>
      <div class="flex gap-4">
        <ThemeSwitch />
        <button
          class="btn btn-sm btn-secondary"
          onClick={async () => await clearStore()}
        >
          Reset store
        </button>
      </div>
      <h2 class="text-xl font-bold mt-4">Shortcuts</h2>
    </div>
  );
};
