import UIThemeCustomizer from './ui';
import GridThemeCustomizer from './grid';

export default function ThemeCustomization() {
  return (
    <div class="grid grid-cols-2 h-full gap-4">
      <UIThemeCustomizer />
      <GridThemeCustomizer />
    </div>
  );
}
