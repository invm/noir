import {
  DialectType,
  Row,
  SORT_ORDER,
  TableStrucureEntityType,
} from "interfaces";

export const log = (msg: any) => {
  console.log(`[${new Date().toISOString()}]`, msg);
};

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

export const sortTableStructure = (
  order: string[],
  dialect: DialectType,
  tableStructureEntity: TableStrucureEntityType
) => {
  return order.sort((a, b) => {
    const sortOrder = SORT_ORDER[dialect][tableStructureEntity];
    if (!sortOrder) return 0;
    const aIndex = sortOrder.indexOf(a as never);
    const bIndex = sortOrder.indexOf(b as never);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
};

// TODO: handle all dialects
export const columnsToSchema = (columns: Row[], _dialect: DialectType) => {
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
