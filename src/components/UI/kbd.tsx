import { useAppSelector } from 'services/Context';

type KbdProps = {
  key: string | number;
};

export const Kbd = (props: KbdProps) => {
  const {
    app: { cmdOrCtrl },
  } = useAppSelector();
  return (
    <kbd class="pointer-events-none p-1 rounded-md h-5 select-none gap-1 border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 flex items-center ">
      <span>{cmdOrCtrl(true)}</span>
      {props.key}
    </kbd>
  );
};
