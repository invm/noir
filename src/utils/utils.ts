import { Dialect, DialectType, Row, Table } from 'interfaces';

export const randomId = () => {
  const length = 36;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

export const getAnyCase = (obj: Row, key: string) => {
  return (obj[key] ? obj[key] : obj[key.toLowerCase()]) as string;
};

export const debounce = (func: (...args: unknown[]) => void, wait: number) => {
  let timer: NodeJS.Timeout;

  return function executedFunction(...args: unknown[]) {
    const later = () => {
      clearTimeout(timer);
      func(...args);
    };

    clearTimeout(timer);
    timer = setTimeout(later, wait);
  };
};

// TODO: handle all dialects
export const columnsToTables = (allColumns: Row[], views: Row[], dialect: DialectType) => {
  if (dialect === Dialect.Mysql || dialect === Dialect.Postgresql) {
    const schema = allColumns.reduce((acc, col) => {
      const table_name = getAnyCase(col, 'TABLE_NAME');
      const column_name = getAnyCase(col, 'COLUMN_NAME');
      acc[table_name] = { ...(acc[table_name] as Record<string, string>), [column_name]: col };
      return acc;
    }, {});
    const viewNames = views.map(({ table_name }) => table_name);

    return Object.keys(schema).reduce(
      (acc, name) => {
        const columns = Object.values(schema[name]).map((props) => {
          const name = getAnyCase(props, 'COLUMN_NAME');
          return { name, props };
        });

        if (viewNames.includes(name)) {
          acc['views'].push({ name, columns });
        } else {
          acc['tables'].push({ name, columns });
        }
        return acc;
      },
      {
        tables: [] as Table[],
        views: [] as Table[],
      }
    );
  }
  return {
    tables: [],
    views: [],
  };
};

export const parseObjRecursive = (obj: unknown): Record<string, unknown | unknown[]> | null | unknown => {
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return obj.map(parseObjRecursive);
    } else if (obj !== null) {
      return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, parseObjRecursive(v)]));
    } else {
      return obj;
    }
  } else {
    try {
      return JSON.parse(obj as string);
    } catch (e) {
      return obj;
    }
  }
};
