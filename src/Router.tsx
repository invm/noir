import {
  Navigate,
  Route,
  Router as SolidRouter,
  useNavigate,
} from '@solidjs/router';
import { ConnectionManager } from 'pages/connections/manager';
import { Console } from 'pages/console/console';
import { Settings } from 'pages/settings/settings';
import { createEffect, ParentComponent } from 'solid-js';
import { Toaster } from 'components/ui/sonner';
import { CommandPalette } from 'services/palette/palette';
import { createShortcut } from '@solid-primitives/keyboard';
import { useAppSelector } from 'services/Context';
import { Action, useCommandPalette } from 'services/palette/context';
import { CommandPaletteProviderComponent } from 'services/palette/provider';
import { CommandPaletteContextWrapper } from 'services/palette/wrapper';
import ConnectedConnectionsProvider from 'components/providers/connected-connections';

const Wrapper: ParentComponent = (props) => {
  const {
    app: { cmdOrCtrl },
  } = useAppSelector();
  const { setOpen } = useCommandPalette();

  const navigate = useNavigate();

  createEffect(() => {
    createShortcut([cmdOrCtrl(), 'k'], () => {
      setOpen((open) => !open);
    });
  }, []);

  const rootActions: Action[] = [
    {
      id: 'settings',
      label: 'Settings',
      callback: () => navigate('/settings'),
    },
    {
      id: 'connections',
      label: 'Manage connections',
      callback: () => navigate('/'),
    },
  ];

  return (
    <CommandPaletteContextWrapper actions={rootActions}>
      <ConnectedConnectionsProvider>
        <main class="h-full w-full flex flex-col">
          <div class="flex-1">{props.children}</div>
          <Toaster position="bottom-center" closeButton />
          <CommandPalette />
        </main>
      </ConnectedConnectionsProvider>
    </CommandPaletteContextWrapper>
  );
};

export const Router = () => {
  return (
    <CommandPaletteProviderComponent>
      <SolidRouter>
        <Route component={Wrapper}>
          <Route path="/" component={ConnectionManager} />
          <Route path="/settings" component={Settings} />
          <Route path="/console/:id" component={Console} />
          <Route path="*" component={() => <Navigate href={'/'} />} />
        </Route>
      </SolidRouter>
    </CommandPaletteProviderComponent>
  );
};
