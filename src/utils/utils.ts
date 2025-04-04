import { Dialect, DialectType, Row, Table } from 'interfaces';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { toast } from 'solid-sonner';

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const randomId = () => {
  const length = 36;
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

export const getAnyCase = (obj: Row, key: string) => {
  if (typeof obj !== 'object') return '';
  return (
    obj[key.toLowerCase()] ? obj[key.toLowerCase()] : obj[key.toUpperCase()]
  ) as string;
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

export const columnsToTables = (
  allColumns: Row[],
  views: Row[],
  dialect: DialectType
) => {
  if (
    [
      Dialect.MariaDB,
      Dialect.Mysql,
      Dialect.Postgresql,
      Dialect.Sqlite,
    ].includes(dialect)
  ) {
    const schema = allColumns.reduce((acc, col) => {
      const table_name = getAnyCase(col, 'table_name');
      const column_name = getAnyCase(col, 'column_name');
      acc[table_name] = {
        ...(acc[table_name] as Record<string, string>),
        [column_name]: col,
      };
      return acc;
    }, {});
    const viewNames = views.map(({ table_name }) => table_name);

    return Object.keys(schema).reduce(
      (acc, name) => {
        const columns = Object.values(schema[name] as object).map((props) => {
          const name = getAnyCase(props, 'column_name');
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

export const parseObjRecursive = (
  obj: unknown
): Record<string, unknown | unknown[]> | null | unknown => {
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return obj.map(parseObjRecursive);
    } else if (obj !== null) {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, parseObjRecursive(v)])
      );
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

export const intersection = (arr: string[], arr2: string[]) => {
  return arr.filter((value) => arr2.includes(value));
};

export const checkForUpdates = async () => {
  const update = await check().catch(() => null);
  if (update?.available) {
    toast(`Version ${update.version} is available`, {
      description: update.body,
      position: 'bottom-right',
      classes: {
        actionButton: '!bg-primary !text-primary-foreground',
        closeButton: '!bg-background !text-foreground',
      },
      closeButton: true,
      action: {
        label: 'Update',
        onClick: async () => {
          try {
            const update = await check().catch(() => null);
            if (!update) return;
            await update.downloadAndInstall((_) => {});
            await relaunch();
          } catch (error) {
            toast.error('Could not update app', {
              description: (error as Error).message || (error as string),
            });
          }
        },
      },
    });
  }
};
