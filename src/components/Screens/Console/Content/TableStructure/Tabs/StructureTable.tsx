export const StructureTable = (props: { data: Record<string, any>[] }) => {
  const columns = props.data.length ? Object.keys(props.data[0]) : [];
  const rows = props.data.map((row) => Object.values(row));
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
                <td>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
