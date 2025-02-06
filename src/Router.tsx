import { Navigate, Route, Router as SolidRouter } from '@solidjs/router';
import { Connections } from 'pages/connections';
import { Console } from 'pages/console';
import { Help } from 'pages/help';
import { Settings } from 'pages/settings';
import { ParentComponent } from 'solid-js';

const NavbarWrapper: ParentComponent = (props) => {
  return <main class="h-full w-full">{props.children}</main>;
};

export const Router = () => {
  return (
    <SolidRouter>
      <Route component={NavbarWrapper}>
        <Route path="/" component={Connections} />
        <Route path="/help" component={Help} />
        <Route path="/settings" component={Settings} />
        <Route path="/console/:id" component={Console} />
        <Route path="*" component={() => <Navigate href={'/'} />} />
      </Route>
    </SolidRouter>
  );
};
