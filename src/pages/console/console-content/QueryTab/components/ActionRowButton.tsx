import { Button } from 'components/ui/button';
import { Loader } from 'components/ui/loader';
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip';
import { Match, Switch } from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';

type ActionRowButton = {
  dataTip: string;
  onClick: () => void;
  icon: JSX.Element;
  loading?: boolean;
};

export const ActionRowButton = (props: ActionRowButton) => {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          size="icon"
          variant="ghost"
          class="h-8 w-8"
          disabled={props.loading !== undefined ? props.loading : false}
          onClick={props.onClick}
        >
          <Switch>
            <Match when={props.loading}>
              <Loader />
            </Match>
            <Match when={!props.loading}>{props.icon}</Match>
          </Switch>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{props.dataTip}</TooltipContent>
    </Tooltip>
  );
};
