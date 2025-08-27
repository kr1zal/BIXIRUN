// Минимальная совместимость с глобалом для RN
type GlobalWithGlobal = typeof globalThis & { global?: unknown };
const g = globalThis as GlobalWithGlobal;
g.global = g.global ?? globalThis;