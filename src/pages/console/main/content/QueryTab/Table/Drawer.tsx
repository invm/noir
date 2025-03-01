import { IoKey as Key } from 'solid-icons/io';
import { NumericTypes } from 'interfaces';
import { useAppSelector } from 'services/Context';
import { For, Match, Show, Switch } from 'solid-js';
import { SetStoreFunction } from 'solid-js/store';
import { t } from 'utils/i18n';
import { getAnyCase } from 'utils/utils';
import { DrawerState } from './PopupCellRenderer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'components/ui/select';
import { TextFieldRoot, TextField } from 'components/ui/textfield';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from 'components/ui/sheet';
import { TextArea } from 'components/ui/textarea';
import { Button } from 'components/ui/button';

type DrawerProps = {
  drawerOpen: DrawerState;
  setDrawerOpen: SetStoreFunction<DrawerState>;
  table: string;
  saveForm: () => void;
};

export const Drawer = (props: DrawerProps) => {
  const {
    app: { cmdOrCtrl },
  } = useAppSelector();

  return (
    <Sheet
      onOpenChange={(open) => props.setDrawerOpen({ open, data: {} })}
      open={true}
    >
      <SheetContent class="overflow-auto flex flex-col gap-0 px-3">
        <SheetHeader class="mb-3">
          <SheetTitle>
            {t(`console.table.${props.drawerOpen.mode}`, {
              table: props.table,
            })}
          </SheetTitle>
          <SheetDescription>
            Apply changes with {cmdOrCtrl(true)} + S
          </SheetDescription>
        </SheetHeader>
        <div class="flex-1 flex flex-col space-y-2">
          <For each={props.drawerOpen.columns}>
            {(col) => {
              const field = getAnyCase(col, 'column_name');
              const visible_type = getAnyCase(col, 'column_type') || '';
              const isEnum = visible_type.includes('enum');
              const enumValues = isEnum
                ? visible_type
                    .replace('enum(', '')
                    .replace(')', '')
                    .replace(/'/g, '')
                    .split(',')
                : [];
              const fk = !!props.drawerOpen.foreign_keys.find((c) => {
                const t = getAnyCase(c, 'column_name');
                return t === field;
              });
              const pk = !!props.drawerOpen.primary_key.find((c) => {
                const t = getAnyCase(c, 'column_name');
                return t === field;
              });
              const isNumber = NumericTypes.some((t) =>
                visible_type.toLowerCase().includes(t)
              );
              const display_type = isEnum ? 'enum' : visible_type;
              const isTextArea = ['json', 'text'].includes(visible_type);
              return (
                <div class="flex flex-col gap-1">
                  <div class="flex justify-between items-center w-full">
                    <span class="text-sm font-semibold flex items-center">
                      <Show when={pk || fk}>
                        <span class="mr-1">
                          <Key
                            class={pk ? 'text-emerald-500' : 'text-yellow-500'}
                          />
                        </span>
                      </Show>
                      {field}
                    </span>
                    <span class="text-sm font-light">{display_type}</span>
                  </div>
                  <Switch>
                    <Match when={isEnum}>
                      <Select
                        class="w-full overflow-hidden"
                        options={enumValues}
                        onChange={(value) => {
                          props.setDrawerOpen('data', field, value);
                        }}
                        value={props.drawerOpen.data[field] ?? ''}
                        itemComponent={(props) => (
                          <SelectItem item={props.item}>
                            {`${props.item.rawValue}`}
                          </SelectItem>
                        )}
                      >
                        <SelectTrigger class="h-8 w-full p-1 flex gap-2">
                          <SelectValue class="overflow-hidden w-full flex justify-start truncate">
                            {(state) => state.selectedOption() as string}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent />
                      </Select>
                    </Match>
                    <Match when={isNumber}>
                      <TextFieldRoot
                        value={props.drawerOpen.data[field] as string}
                        onChange={(value) => {
                          props.setDrawerOpen('data', field, Number(value));
                        }}
                        class="w-full"
                      >
                        <TextField type="number" size="sm" class="h-8" />
                      </TextFieldRoot>
                    </Match>
                    <Match when={isTextArea}>
                      <TextFieldRoot
                        value={props.drawerOpen.data[field]?.toString()}
                        onChange={(value) => {
                          props.setDrawerOpen('data', field, value);
                        }}
                      >
                        <TextArea />
                      </TextFieldRoot>
                    </Match>
                    <Match when={!isEnum && !isNumber}>
                      <TextFieldRoot
                        inputMode="text"
                        value={props.drawerOpen.data[field] as string}
                        onChange={(value) => {
                          props.setDrawerOpen('data', field, value);
                        }}
                        class="w-full"
                      >
                        <TextField size="sm" class="h-8" />
                      </TextFieldRoot>
                    </Match>
                  </Switch>
                </div>
              );
            }}
          </For>
        </div>
        <SheetFooter class="py-10">
          <Button onClick={props.saveForm} size="sm">
            {t('console.actions.apply')} ({cmdOrCtrl(true)} + S)
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
