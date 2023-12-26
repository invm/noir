import { DialectType, Row, SORT_ORDER, Table, TableStrucureEntityType } from 'interfaces';

// TODO: address those anys
export const log = (msg: unknown) => {
  console.log(`[${new Date().toISOString()}]`, msg);
};

export const get = (obj: Record<string, unknown>, path: string) => {
  const travel = (regexp: RegExp) =>
    String.prototype.split // eslint-disable-line
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
};

export const randomId = () => {
  const length = 36;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
  const schema = columns.reduce((acc, col) => {
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
  // todo: is this correct
  return schema as Record<string, Table>;
};
