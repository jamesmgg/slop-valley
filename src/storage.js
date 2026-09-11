import { migrateGame } from "./game.js";

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
      ![1, 2].includes(value.version) ||
      !Array.isArray(value.agents) ||
      value.agents.length < 1 ||
      value.agents.length > 8
    )
      return base;
    if (
      value.version === 2 &&
      (!Array.isArray(value.products) ||
        !value.products.every(
          (product) =>
            product &&
            typeof product.id === "string" &&
            typeof product.title === "string" &&
            ["growing", "steady", "declining", "dead", "sunset"].includes(
              product.status,
            ) &&
            [
              "dailyRevenue",
              "totalRevenue",
              "age",
              "health",
              "ceiling",
              "quality",
              "potential",
            ].every(
              (key) => Number.isFinite(product[key]) && product[key] >= 0,
            ) &&
            Array.isArray(product.history) &&
            Array.isArray(product.comments) &&
            (!product.investment ||
              value.agents.some(
                (agent) =>
                  agent.id === product.investment.agentId &&
                  agent.status === "working" &&
                  agent.projectTask?.productId === product.id,
              )),
        ))
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
    const migrated = migrateGame({ ...base, ...value });
    return { ...migrated, paused: true, lastResult: null };
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
