import { A } from '@solidjs/router';
import { Button } from 'components/ui/button';
import { Separator } from 'components/ui/separator';

export const Connections = () => {
  return (
    <div>
      <h1>Connections</h1>
      <Button>this is a button</Button>
      <Separator />
      <div>
        <A href="/">Connections</A>
        <A href="/console/asd">Console</A>
        <A href="/help">Help</A>
        <A href="/settings">Settings</A>
      </div>
    </div>
  );
};
