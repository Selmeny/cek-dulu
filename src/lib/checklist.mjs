export const STORAGE_KEY = "cek-dulu-checklist-v1";

export const ROLE_IDS = ["ponsel", "uang", "penjual", "pelajar", "ortu"];

export function emptyStore() {
  return { role: null, done: {} };
}

export function parseStore(raw, roleIds = ROLE_IDS) {
  if (typeof raw !== "string" || raw === "") return emptyStore();
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    return emptyStore();
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptyStore();
  const done = {};
  if (value.done && typeof value.done === "object" && !Array.isArray(value.done)) {
    for (const id of roleIds) {
      const marks = value.done[id];
      if (!Array.isArray(marks)) continue;
      done[id] = marks.filter((item) => typeof item === "string");
    }
  }
  const role = roleIds.includes(value.role) ? value.role : null;
  return { role, done };
}

export function markDone(store, role, topicId) {
  const current = store.done[role] ?? [];
  const next = current.includes(topicId) ? current : [...current, topicId];
  return { role: store.role, done: { ...store.done, [role]: next } };
}

export function markUndone(store, role, topicId) {
  const current = store.done[role] ?? [];
  return {
    role: store.role,
    done: { ...store.done, [role]: current.filter((id) => id !== topicId) },
  };
}

export function chooseRole(store, role) {
  return { role, done: { ...store.done } };
}

export function clearRole(store) {
  return { role: null, done: { ...store.done } };
}

export function isComplete(store, role, topicIds) {
  const marks = new Set(store.done[role] ?? []);
  return topicIds.every((id) => marks.has(id));
}
