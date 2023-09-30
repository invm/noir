import { DialectType, Row, TableStrucureEntityType } from "interfaces";
import { sortTableStructure } from "utils/utils";

export const StructureTable = (props: {
  data: Row[];
  dialect: DialectType;
  type: TableStrucureEntityType;
}) => {
  const columns = props.data.length
    ? sortTableStructure(Object.keys(props.data[0]), props.dialect, props.type)
    : [];
  const rows = props.data.map((row) => columns.map((column) => row[column]));
  return (
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th></th>
            {columns.map((column) => (
              <th>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
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
  );
};
