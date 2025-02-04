import { A } from '@solidjs/router';

export const Help = () => {
  return (
    <div>
      <h1>Help</h1>
      <div>
        <A href="/">Connections</A>
        <A href="/console/asd">Console</A>
        <A href="/help">Help</A>
        <A href="/settings">Settings</A>
      </div>
    </div>
  );
};
