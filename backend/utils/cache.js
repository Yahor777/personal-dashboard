const store = new Map();

const normalize = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([k, v]) => [k, normalize(v)]);
    return Object.fromEntries(entries);
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return value;
};

const toMillis = (ttlSeconds) => {
  const seconds = Number.isFinite(ttlSeconds) ? ttlSeconds : 0;
  return Math.max(0, seconds) * 1000;
};

function generateKey(base, modifiers = {}) {
  const normalizedBase = String(base ?? "").trim().toLowerCase();
  const normalizedModifiers = normalize(modifiers);
  return `${normalizedBase}::${JSON.stringify(normalizedModifiers)}`;
}

function get(key) {
  const cached = store.get(key);
  if (!cached) {
    return undefined;
  }
  if (cached.expiresAt && cached.expiresAt < Date.now()) {
    store.delete(key);
    return undefined;
  }
  return cached.value;
}

function set(key, value, ttlSeconds) {
  const expiresAt = ttlSeconds ? Date.now() + toMillis(ttlSeconds) : undefined;
  store.set(key, { value, expiresAt });
}

function del(key) {
  store.delete(key);
}

function clear() {
  store.clear();
}

function size() {
  return store.size;
}

function prune() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt && entry.expiresAt < now) {
      store.delete(key);
    }
  }
}

export default {
  generateKey,
  get,
  set,
  delete: del,
  clear,
  size,
  prune,
};
