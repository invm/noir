import { createShortcut } from '@solid-primitives/keyboard';
import { Key } from 'components/UI/Icons';
import { NumerticTypes, Row } from 'interfaces';
import { useAppSelector } from 'services/Context';
import { For, Match, Show, Switch } from 'solid-js';
import { SetStoreFunction } from 'solid-js/store';
import { t } from 'utils/i18n';
import { getAnyCase } from 'utils/utils';

type DrawerProps = {
  drawerOpen: { open: boolean; data: Row; columns: Row[]; constraints: Row[] };
  setDrawerOpen: SetStoreFunction<{ open: boolean; data: Row; columns: Row[]; constraints: Row[] }>;
  table: string;
  saveForm: () => void;
};

export const Drawer = (props: DrawerProps) => {
  const {
    app: { cmdOrCtrl },
  } = useAppSelector();

  createShortcut([cmdOrCtrl(), 's'], () => {
    if (props.drawerOpen.open) {
      props.saveForm();
    }
  });

  return (
    <div class="drawer drawer-end z-10">
      <input id="my-drawer-4" checked={props.drawerOpen.open} type="checkbox" class="drawer-toggle" />
      <div class="drawer-content"></div>
      <div class="drawer-side overflow-hidden h-full">
        <label
          for="my-drawer-4"
          onClick={(e) => {
            e.preventDefault();
            props.setDrawerOpen({ open: false, data: {} });
          }}
          aria-label="close sidebar"
          class="drawer-overlay !cursor-default"></label>
        <div class="bg-base-200  min-h-full w-3/12 overflow-auto h-full p-3">
          <div>
            <span class="text-lg font-bold mb-4">{t('console.table.editing', { table: props.table })}</span>
            <For each={Object.keys(props.drawerOpen.data)}>
              {(key) => {
                const col =
                  props.drawerOpen.columns.find((c) => {
                    const t = getAnyCase(c, 'column_name');
                    if (t === key) {
                      return true;
                    }
                  }) ?? {};
                const type = getAnyCase(col, 'column_type');
                const isEnum = type.includes('enum');
                const enumValues = isEnum
                  ? type.replace('enum(', '').replace(')', '').replace(/'/g, '').split(',')
                  : [];
                const isKey = !!props.drawerOpen.constraints.find((c) => {
                  const t = getAnyCase(c, 'column_name');
                  return t === key;
                });
                const isNumber = NumerticTypes.some((t) => type.includes(t));
                const display_type = isEnum ? 'enum' : type;
                const isTextArea = ['json', 'text'].includes(type);
                return (
                  <div class="flex flex-col">
                    <div class="flex justify-between items-center mt-2 w-full">
                      <span class="text-sm font-semibold flex items-center">
                        <Show when={isKey}>
                          <span class="mr-1">
                            <Key />
                          </span>
                        </Show>
                        {key}
                      </span>
                      <span class="text-sm font-light">{display_type}</span>
                    </div>
                    <Switch>
                      <Match when={isEnum}>
                        <select
                          // @ts-ignore
                          value={props.drawerOpen.data[key]}>
                          <For each={enumValues}>
                            {(value) => {
                              return <option value={value}>{value}</option>;
                            }}
                          </For>
                        </select>
                      </Match>
                      <Match when={isNumber}>
                        <input
                          type="number"
                          // @ts-ignore
                          value={props.drawerOpen.data[key]}
                          class="input input-bordered border-base-content input-xs"
                          onChange={(e) => {
                            props.setDrawerOpen({
                              open: true,
                              data: { ...props.drawerOpen.data, [key]: e.target.value },
                            });
                          }}
                        />
                      </Match>
                      <Match when={isTextArea}>
                        <textarea
                          // @ts-ignore
                          value={props.drawerOpen.data[key]}
                          class="input min-h-[100px] input-bordered border-base-content input-xs"
                          onChange={(e) => {
                            props.setDrawerOpen({
                              open: true,
                              data: { ...props.drawerOpen.data, [key]: e.target.value },
                            });
                          }}
                        />
                      </Match>
                      <Match when={!isEnum && !isNumber}>
                        <input
                          type="text"
                          // @ts-ignore
                          value={props.drawerOpen.data[key]}
                          class="input input-bordered border-base-content input-xs"
                          onChange={(e) => {
                            props.setDrawerOpen({
                              open: true,
                              data: { ...props.drawerOpen.data, [key]: e.target.value },
                            });
                          }}
                        />
                      </Match>
                    </Switch>
                  </div>
                );
              }}
            </For>
            <div class="pt-10"></div>
          </div>
          <button onClick={props.saveForm} class="bottom-0 right-0 btn btn-primary btn-block btn-xs">
            {t('console.actions.apply')} ({cmdOrCtrl(true)} + S)
          </button>
        </div>
      </div>
    </div>
  );
};
