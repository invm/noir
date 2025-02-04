import { A } from '@solidjs/router';
import ThemeCustomizer from 'components/theme-customizer';

export const Settings = () => {
  return (
    <div>
      <h1>Settings</h1>
      <ThemeCustomizer />
      <div>
        <A href="/">Connections</A>
        <A href="/console/asd">Console</A>
        <A href="/help">Help</A>
        <A href="/settings">Settings</A>
      </div>
    </div>
  );
};
