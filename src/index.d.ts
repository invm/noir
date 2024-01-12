import { TippyOptions } from 'solid-tippy';

declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      tippy: TippyOptions;
    }
  }
}
