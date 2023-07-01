export const omit = (obj: any, ...keys: string[]) => {
  const copy = { ...obj };
  keys.forEach(key => delete copy[key]);
  return copy;
}

export const firstKey = (obj: Record<string, any>) => {
  for (const key in obj) return key;
}

