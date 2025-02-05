import { Router, Route } from '@solidjs/router';
import { Connections } from 'pages/connections';
import { Console } from 'pages/console/console';
import { Help } from 'pages/help';
import { Settings } from 'pages/settings';

export const AppRouter = () => {
  return (
    <Router>
      <Route path="/" component={Connections} />
      <Route path="/help" component={Help} />
      <Route path="/settings" component={Settings} />
      <Route path="/console/:id" component={Console} />
    </Router>
  );
};
