import { Navigate, Route, Router as SolidRouter } from '@solidjs/router';
import { ConnectionManager } from 'pages/connections/manager';
import { Console } from 'pages/console/console';
import { Settings } from 'pages/settings/settings';
import { ParentComponent } from 'solid-js';

const NavbarWrapper: ParentComponent = (props) => {
  return <main class="h-full w-full">{props.children}</main>;
};

export const Router = () => {
  return (
    <SolidRouter>
      <Route component={NavbarWrapper}>
        <Route path="/" component={ConnectionManager} />
        <Route path="/settings" component={Settings} />
        <Route path="/console/:id" component={Console} />
        <Route path="*" component={() => <Navigate href={'/'} />} />
      </Route>
    </SolidRouter>
  );
};
