import { SORT_ORDER, TableStructureResult } from "interfaces";

export const omit = (obj: any, ...keys: string[]) => {
  const copy = { ...obj };
  keys.forEach((key) => delete copy[key]);
  return copy;
};

export const firstKey = (obj: Record<string, any>) => {
  for (const key in obj) return key;
};

export const randomId = () => {
  const length = 36;
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const debounce = (func: Function, wait: number) => {
  let timer: NodeJS.Timeout;

  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timer);
      func(...args);
    };

    clearTimeout(timer);
    timer = setTimeout(later, wait);
  };
};

export const sortTableStructure = (tableStructure: TableStructureResult) => { };

// TODO: for all dialects
export const columnsToSchema = (columns: Record<string, any>[]) => {
  const schema = columns.reduce((acc: any, col: any) => {
    return {
      ...acc,
      [col.TABLE_SCHEMA]: {
        ...acc[col.TABLE_SCHEMA],
        [col.TABLE_NAME]: {
          ...acc[col.TABLE_SCHEMA]?.[col.TABLE_NAME],
          [col.COLUMN_NAME]: col,
        },
      },
    };
  }, {});
  return schema;
};
