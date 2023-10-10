import { Match, Switch } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";

type ActionRowButton = {
  dataTip: string;
  onClick: () => void;
  icon: JSX.Element;
  loading?: boolean;
};

export const ActionRowButton = (props: ActionRowButton) => {
  return (
    <div
      class="tooltip tooltip-primary tooltip-bottom"
      data-tip={props.dataTip}
    >
      <button
        class="btn btn-ghost btn-sm mr-2 text-primary"
        disabled={props.loading !== undefined ? props.loading : false}
        onClick={props.onClick}
      >
        <Switch>
          <Match when={props.loading}>
            <span class="loading text-primary loading-bars loading-xs"></span>
          </Match>
          <Match when={!props.loading}>{props.icon}</Match>
        </Switch>
      </button>
    </div>
  );
};
