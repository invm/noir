import { createEffect, createMemo, createSignal, For } from 'solid-js';
import {
  JSONValue,
  TableEntity,
  TableStrucureEntities,
  TableStrucureEntityType,
} from 'interfaces';
import { t } from 'utils/i18n';
import { useAppSelector } from 'services/Context';
import {
  Tabs,
  TabsContent,
  TabsIndicator,
  TabsList,
  TabsTrigger,
} from 'components/ui/tabs';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/ui/table';
import { TextField, TextFieldRoot } from 'components/ui/textfield';

export const TableStructureTab = (props: { tabIdx: number }) => {
  const {
    connections: { getContentData },
  } = useAppSelector();
  const [tab, setTab] = createSignal<TableStrucureEntityType>(
    TableEntity.columns
  );
  const [columns, setColumns] = createSignal<string[]>([]);
  const [rows, setRows] = createSignal<JSONValue[][]>([]);
  const [search, setSearch] = createSignal('');

  createEffect(() => {
    const data = getContentData('TableStructure')[tab()];
    const _columns = Object.keys(data?.[0] ?? {});
    const _rows = data.map((row) => _columns.map((column) => row[column]));
    setColumns(_columns);
    setRows(_rows);
  }, [props.tabIdx]);

  const filteredRows = createMemo(() => {
    const searchTerm = search().toLowerCase();
    if (!searchTerm) {
      return rows();
    }

    return rows().filter((row) =>
      row.some((cell) => String(cell).toLowerCase().includes(searchTerm))
    );
  });

  return (
    <Tabs
      onChange={(a) => setTab(a as TableStrucureEntityType)}
      value={tab()}
      class="p-2 flex flex-col gap-2 h-full"
    >
      <div class="w-full grid grid-cols-12 pb-2 gap-4 ">
        <TextFieldRoot
          inputMode="text"
          value={search()}
          onChange={setSearch}
          class="col-span-4"
        >
          <TextField placeholder="Search for columns..." class="w-full" />
        </TextFieldRoot>
        <TabsList class="col-span-8">
          <For each={TableStrucureEntities}>
            {(ta) => (
              <TabsTrigger value={ta}>
                {t(`table_structure_tab.${ta}`)}
              </TabsTrigger>
            )}
          </For>
          <TabsIndicator />
        </TabsList>
      </div>
      <For each={TableStrucureEntities}>
        {(tab) => (
          <TabsContent value={tab}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-[50px]"></TableHead>
                  <For each={columns()}>
                    {(column) => <TableHead>{column}</TableHead>}
                  </For>
                </TableRow>
              </TableHeader>
              <TableBody>
                <For each={filteredRows()}>
                  {(row, idx) => (
                    <TableRow>
                      <TableCell class="font-medium">{idx() + 1}</TableCell>
                      <For each={row}>
                        {(cell) => <TableCell>{String(cell)}</TableCell>}
                      </For>
                    </TableRow>
                  )}
                </For>
              </TableBody>
            </Table>
          </TabsContent>
        )}
      </For>
    </Tabs>
  );
};
