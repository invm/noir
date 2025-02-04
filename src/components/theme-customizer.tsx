import { FaSolidMoon, FaSolidSun } from 'solid-icons/fa';
import { IoRefresh } from 'solid-icons/io';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'components/ui/card';
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemLabel,
} from 'components/ui/radio-group';
import { Label } from 'components/ui/label';
import { createStore } from 'solid-js/store';
import { createEffect, For } from 'solid-js';
import { Button } from './ui/button';
import { useColorMode } from '@kobalte/core';

const RADIUS = '--radius';
const PRIMARY = '--primary';

export const setProperty = (property: string, value: string) => {
  document.documentElement.style.setProperty(property, value);
};

const getSavedValues = () => {
  const radius = localStorage.getItem(RADIUS);
  const primary = localStorage.getItem(PRIMARY);
  return { radius, primary };
};

export const restoreTheme = () => {
  const { primary, radius } = getSavedValues();
  if (!radius || !primary) return;
  const { radiusRem, hue } = transformValues(radius, primary);
  setProperty(RADIUS, radiusRem);
  setProperty(PRIMARY, hue!);
};

const transformValues = (radius: string, color: string) => {
  const hue = {
    zinc: '0 0% 100%',
    red: '0 84.2% 60.2%',
    rose: '346.8 77.2% 49.8%',
    orange: '24.6 95% 53.1%',
    green: '142.1 76.2% 36.3%',
    blue: '221.2 83.2% 53.3%',
    yellow: '47.9 95.8% 53.1%',
    violet: '262.1 83.3% 57.8%',
  }[color];
  return { radiusRem: `${radius}rem`, hue: hue };
};

export default function ThemeCustomizer() {
  const { setColorMode, colorMode } = useColorMode();
  const { primary, radius } = getSavedValues();
  const [theme, setTheme] = createStore({
    color: primary || 'zinc',
    radius: radius || '0.5',
  });

  const colors = [
    { name: 'Zinc', value: 'zinc', class: 'bg-zinc-500' },
    { name: 'Red', value: 'red', class: 'bg-red-500' },
    { name: 'Rose', value: 'rose', class: 'bg-rose-500' },
    { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
    { name: 'Green', value: 'green', class: 'bg-green-500' },
    { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
    { name: 'Yellow', value: 'yellow', class: 'bg-yellow-500' },
    { name: 'Violet', value: 'violet', class: 'bg-violet-500' },
  ];

  const radiusOptions = ['0.3', '0.5', '0.7', '1.0'];

  createEffect(() => {
    const { radiusRem, hue } = transformValues(theme.radius, theme.color);
    setProperty(RADIUS, radiusRem);
    localStorage.setItem(RADIUS, theme.radius);
    setProperty(PRIMARY, hue!);
    localStorage.setItem(PRIMARY, theme.color);
  });

  return (
    <Card class="w-full max-w-[400px]">
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          Theme Customizer
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setTheme({ color: 'zinc', radius: '0.5' });
              setColorMode('dark');
            }}
          >
            <IoRefresh class="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>Customize your theme colors.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <h3 class="text-lg font-medium">Color</h3>
          <RadioGroup
            value={theme.color}
            onChange={(value) => {
              setTheme({ ...theme, color: value });
            }}
            class="grid grid-cols-3 gap-2"
          >
            <For each={colors}>
              {(color) => (
                <RadioGroupItem
                  value={color.value}
                  class="flex items-center gap-2"
                >
                  <RadioGroupItemLabel
                    onClick={() => setTheme({ ...theme, color: color.value })}
                    class={`flex items-center space-x-2 rounded-lg border py-1 px-4 cursor-pointer [&:has(:checked)]:bg-accent ${
                      theme.color === color.value ? 'border-primary' : ''
                    }`}
                    classList={{ 'bg-accent': theme.color === color.value }}
                  >
                    <div class={`h-4 w-4 rounded-full ${color.class}`} />
                    <span class="text-sm">{color.name}</span>
                  </RadioGroupItemLabel>
                </RadioGroupItem>
              )}
            </For>
          </RadioGroup>
        </div>

        <div class="space-y-2">
          <h3 class="text-lg font-medium">Radius</h3>
          <RadioGroup
            value={theme.radius}
            class="flex flex-wrap gap-2 justify-between"
          >
            <For each={radiusOptions}>
              {(radius) => (
                <RadioGroupItem
                  value={radius}
                  class="flex items-center flex-1 justify-center gap-2 "
                >
                  <RadioGroupItemLabel
                    onClick={() => setTheme({ ...theme, radius })}
                    class={`flex flex-1 items-center justify-center space-x-2 rounded-lg border py-1 px-4 cursor-pointer overflow-hidden ${
                      theme.radius === radius ? 'border-primary' : ''
                    }`}
                    classList={{ 'bg-accent': theme.radius === radius }}
                  >
                    <span class="text-sm">{radius}</span>
                  </RadioGroupItemLabel>
                </RadioGroupItem>
              )}
            </For>
          </RadioGroup>
        </div>

        <div class="space-y-4">
          <h3 class="text-lg font-medium">Mode</h3>
          <RadioGroup value={colorMode()} class="flex gap-2">
            <Label
              onClick={() => setColorMode('light')}
              class={`flex items-center space-x-2 rounded-lg border py-2 px-4 cursor-pointer ${
                colorMode() === 'light' ? 'border-primary font-bold' : ''
              }`}
              classList={{ 'bg-accent': colorMode() === 'light' }}
            >
              <RadioGroupItem value="light" id="light" class="sr-only" />
              <FaSolidSun class="h-4 w-4" />
              <span>Light</span>
            </Label>
            <Label
              onClick={() => setColorMode('dark')}
              class={`flex items-center space-x-2 rounded-lg border py-2 px-4 cursor-pointer [&:has(:checked)]:bg-accent ${
                colorMode() === 'dark' ? 'border-primary font-bold' : ''
              }`}
              classList={{ 'bg-accent': colorMode() === 'dark' }}
            >
              <RadioGroupItem value="dark" id="dark" class="sr-only" />
              <FaSolidMoon class="h-4 w-4" />
              <span>Dark</span>
            </Label>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
