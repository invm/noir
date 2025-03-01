import { useAppSelector } from 'services/Context';
import { Match, Show, Switch } from 'solid-js';
import { BsShift, BsChevronUp, BsCommand } from 'solid-icons/bs';

type KbdProps = {
  control?: boolean;
  shift?: boolean;
  key: string | number;
};

export const Kbd = (props: KbdProps) => {
  const {
    app: { cmdOrCtrl },
  } = useAppSelector();
  return (
    <kbd class="pointer-events-none p-1 rounded-md h-5 select-none gap-1 border bg-muted px-1 font-mono text-[12px] font-semibold flex items-center ">
      <Switch>
        <Match when={props.control || cmdOrCtrl(true) === '^'}>
          <BsChevronUp class="!size-3" />
        </Match>
        <Match when={!props.control && cmdOrCtrl(true) !== '^'}>
          <BsCommand class="!size-3" />
        </Match>
      </Switch>

      <Show when={props.shift}>
        <BsShift class="!size-3" />
      </Show>
      {props.key}
    </kbd>
  );
};
