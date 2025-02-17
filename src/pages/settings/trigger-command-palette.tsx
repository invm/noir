import { useAppSelector } from 'services/Context';

const TriggerCommandPalette = () => {
  const {
    app: { cmdOrCtrl },
  } = useAppSelector();

  return (
    <div>
      <div class="flex gap-2">
        <span>Command Palette </span>
        <div>
          <kbd class="pointer-events-none p-1 rounded-md hidden h-5 select-none items-center gap-1 border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span class="text-xs">{cmdOrCtrl(true)}</span>K
          </kbd>
        </div>
      </div>
    </div>
  );
};

export default TriggerCommandPalette;
