export const omit = (obj: any, ...keys: string[]) => {
  const copy = { ...obj };
  keys.forEach(key => delete copy[key]);
  return copy;
}

