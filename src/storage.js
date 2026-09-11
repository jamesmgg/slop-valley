export const SAVE_KEY = "slop-valley-save-v1";
export function readFlag(storage, key) {
  try {
    return storage?.getItem(key) === "1";
  } catch {
    return false;
  }
}
export function readSave(storage, fallback) {
  try {
    const value = JSON.parse(storage.getItem(SAVE_KEY));
    const base = fallback();
    if (
      !value ||
      value.version !== 1 ||
      !Array.isArray(value.agents) ||
      value.agents.length < 1 ||
      value.agents.length > 8
    )
      return base;
    if (
      ![
        "cash",
        "followers",
        "attention",
        "elapsed",
        "rng",
        "nextId",
        "nextEventAt",
      ].every((key) => Number.isFinite(value[key]) && value[key] >= 0)
    )
      return base;
    if (
      !value.agents.every(
        (agent) =>
          agent &&
          typeof agent.id === "string" &&
          typeof agent.name === "string" &&
          ["working", "review", "idle"].includes(agent.status) &&
          Number.isFinite(agent.progress) &&
          (agent.status === "idle" ||
            (agent.idea &&
              typeof agent.idea.title === "string" &&
              Array.isArray(agent.idea.notes))),
      )
    )
      return base;
    if (
      !Array.isArray(value.feed) ||
      !Array.isArray(value.achievements) ||
      !value.upgrades ||
      !["model", "context"].every((key) => Number.isFinite(value.upgrades[key]))
    )
      return base;
    return { ...base, ...value, paused: true, lastResult: null };
  } catch {
    return fallback();
  }
}
export function writeSave(storage, state) {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
