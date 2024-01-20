import { createShortcut } from '@solid-primitives/keyboard';
import { Key } from 'components/UI/Icons';
import { NumericTypes, Row } from 'interfaces';
import { useAppSelector } from 'services/Context';
import { For, Match, Show, Switch } from 'solid-js';
import { SetStoreFunction } from 'solid-js/store';
import { t } from 'utils/i18n';
import { getAnyCase } from 'utils/utils';

type DrawerProps = {
  drawerOpen: { open: boolean; data: Row; columns: Row[]; foreign_keys: Row[], primary_key: Row[] };
  setDrawerOpen: SetStoreFunction<{ open: boolean; data: Row; columns: Row[]; foreign_keys: Row[] }>;
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
              {(field) => {
                const col =
                  props.drawerOpen.columns.find((c) => {
                    const t = getAnyCase(c, 'column_name');
                    if (t === field) {
                      return true;
                    }
                  }) ?? {};
                const visible_type = getAnyCase(col, 'column_type') || '';
                const isEnum = visible_type.includes('enum');
                const enumValues = isEnum
                  ? visible_type.replace('enum(', '').replace(')', '').replace(/'/g, '').split(',')
                  : [];
                const fk = !!props.drawerOpen.foreign_keys.find((c) => {
                  const t = getAnyCase(c, 'column_name');
                  return t === field;
                });
                const pk = !!props.drawerOpen.primary_key.find((c) => {
                  const t = getAnyCase(c, 'column_name');
                  return t === field;
                });
                const isNumber = NumericTypes.some((t) => visible_type.includes(t));
                const display_type = isEnum ? 'enum' : visible_type;
                const isTextArea = ['json', 'text'].includes(visible_type);
                return (
                  <div class="flex flex-col">
                    <div class="flex justify-between items-center mt-2 w-full">
                      <span class="text-sm font-semibold flex items-center">
                      <Show when={pk || fk}>
                        <span class="mr-1">
                          <Key color={pk ? 'success' : 'warning'} />
                        </span>
                      </Show>
                        {field}
                      </span>
                      <span class="text-sm font-light">{display_type}</span>
                    </div>
                    <Switch>
                      <Match when={isEnum}>
                        <select
                          // @ts-ignore
                          value={props.drawerOpen.data[field]}>
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
                          value={props.drawerOpen.data[field]}
                          class="input input-bordered border-base-content input-xs"
                          onChange={(e) => {
                            props.setDrawerOpen({
                              open: true,
                              data: { ...props.drawerOpen.data, [field]: e.target.value },
                            });
                          }}
                        />
                      </Match>
                      <Match when={isTextArea}>
                        <textarea
                          // @ts-ignore
                          value={props.drawerOpen.data[field]}
                          class="input min-h-[100px] input-bordered border-base-content input-xs"
                          onChange={(e) => {
                            props.setDrawerOpen({
                              open: true,
                              data: { ...props.drawerOpen.data, [field]: e.target.value },
                            });
                          }}
                        />
                      </Match>
                      <Match when={!isEnum && !isNumber}>
                        <input
                          type="text"
                          // @ts-ignore
                          value={props.drawerOpen.data[field]}
                          class="input input-bordered border-base-content input-xs"
                          onChange={(e) => {
                            props.setDrawerOpen({
                              open: true,
                              data: { ...props.drawerOpen.data, [field]: e.target.value },
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
