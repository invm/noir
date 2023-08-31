import { SORT_ORDER, TableStructureResult } from "interfaces";

export const omit = (obj: any, ...keys: string[]) => {
  const copy = { ...obj };
  keys.forEach((key) => delete copy[key]);
  return copy;
};

export const firstKey = (obj: Record<string, any>) => {
  for (const key in obj) return key;
};

export const randomId = () => Math.random().toString(36).substring(12);

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
