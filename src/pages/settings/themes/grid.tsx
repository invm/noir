import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'components/ui/card';
import { Button } from 'components/ui/button';
import { useAppSelector } from 'services/Context';
import { IoRefresh } from 'solid-icons/io';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'components/ui/select';
import { GRID_THEMES } from 'services/App';
import { titleCase } from 'utils/formatters';
import AgGridSolid from 'ag-grid-solid';
import { ColDef } from 'ag-grid-community';

const columnsDef: ColDef[] = [
  { field: 'athlete', sortable: true, filter: false, width: 150 },
  { field: 'age', sortable: true, filter: false, width: 90 },
  { field: 'country', sortable: true, filter: false, width: 120 },
];

const data = [
  { athlete: 'Michael Phelps', age: 22, country: 'United States' },
  { athlete: 'Natalie Coughlin', age: 22, country: 'Australia' },
  { athlete: 'Tyler Seager', age: 23, country: 'United States' },
];

export default function GridThemeCustomizer() {
  const {
    app: { updateTheme, gridTheme },
  } = useAppSelector();

  return (
    <Card class="flex-1">
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          Grid
          <Button
            variant="ghost"
            size="icon"
            onClick={() => updateTheme('alpine-dark')}
          >
            <IoRefresh class="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>Customize grid colors.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="w-full flex justify-end">
          <Select
            class="w-36"
            options={GRID_THEMES}
            onChange={(value) => updateTheme(value || GRID_THEMES[0])}
            value={gridTheme()}
            itemComponent={(props) => (
              <SelectItem item={props.item}>
                {props.item.rawValue.split('-').map(titleCase).join(' ')}
              </SelectItem>
            )}
          >
            <SelectTrigger class="h-8 w-full">
              <SelectValue>
                {(state) =>
                  (state.selectedOption() as string)
                    .split('-')
                    .map(titleCase)
                    .join(' ')
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        </div>

        <div class={'select-text h-[240px] ag-theme-' + gridTheme()}>
          {/* <AgGridSolid
            columnDefs={columnsDef}
            rowSelection="multiple"
            rowData={data}
          /> */}
        </div>
      </CardContent>
    </Card>
  );
}
