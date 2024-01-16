import { createEffect, createSignal } from 'solid-js';
import { JSONValue, TableEntity, TableStrucureEntities, TableStrucureEntityType } from 'interfaces';
import { t } from 'utils/i18n';
import { useAppSelector } from 'services/Context';

export const TableStructureTab = (props: { tabIdx: number }) => {
  const {
    connections: { getContentData },
  } = useAppSelector();
  const [tab, setTab] = createSignal<TableStrucureEntityType>(TableEntity.columns);
  const [columns, setColumns] = createSignal<string[]>([]);
  const [rows, setRows] = createSignal<JSONValue[][]>([]);

  createEffect(() => {
    const data = getContentData('TableStructure')[tab()];
    const _columns = Object.keys(data?.[0] ?? {});
    const _rows = data.map((row) => _columns.map((column) => row[column]));
    setColumns(_columns);
    setRows(_rows);
  }, [props.tabIdx]);

  return (
    <div class="bg-base-100 rounded-tl-md p-2 h-full pb-[100px] overflow-y-scroll">
      <div>
        <div class="flex justify-center">
          <div class="tabs tabs-boxed gap-3">
            {TableStrucureEntities.map((ta) => (
              <button onClick={() => setTab(ta)} tabIndex={0} classList={{ 'tab-active': tab() === ta }} class="tab">
                {t(`table_structure_tab.${ta}`)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th></th>
                  {columns().map((column) => (
                    <th>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows().map((row, idx) => (
                  <tr>
                    <th>{idx + 1}</th>
                    {row.map((cell) => (
                      <td>{String(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
