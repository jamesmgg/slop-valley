import { ACTIONS, getEconomy } from "./game.js";

export function nextReadyAgent(state, currentId) {
  const start = state.agents.findIndex((agent) => agent.id === currentId);
  for (let offset = 1; offset <= state.agents.length; offset++) {
    const agent =
      state.agents[
        (start + offset + state.agents.length) % state.agents.length
      ];
    if (agent.id !== currentId && agent.status === "review") return agent;
  }
  return null;
}

const effects = {
  polish: "Improve usefulness. Remove imaginary features.",
  validate: "Improve market fit. Ask an actual human.",
  pivot: "Reroll the opportunity. Same questionable founder.",
  hype: "Increase reach. Expectations sold separately.",
  custom: "Steer the next draft with your own instructions.",
};

export function feedbackInfo(state, mode) {
  const spec = ACTIONS[mode];
  const attention = getEconomy(state).attentionCosts[mode];
  const deficits = [];
  if (state.cash < spec.cost)
    deficits.push(`$${Math.ceil(spec.cost - state.cash)} more`);
  if (state.attention < attention)
    deficits.push(`${Math.ceil(attention - state.attention)} attention`);
  return {
    cost: spec.cost,
    attention,
    seconds: Math.max(
      6,
      Math.round(spec.duration * (1 - state.upgrades.model * 0.08)),
    ),
    effect: effects[mode],
    disabled: deficits.length > 0,
    reason: deficits.length ? `Need ${deficits.join(" + ")}` : "",
  };
}
