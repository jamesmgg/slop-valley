import { IDEAS, THEMES, generateComments, classifyTheme } from "./content.js";
// A deterministic, local-only management game. Every post and sponsor is fictional.
export const ACTIONS = {
  polish: {
    id: "polish",
    label: "Fix the actual product",
    description: "Improve quality · regressions happen",
    cost: 32,
    attention: 9,
    duration: 17,
  },
  validate: {
    id: "validate",
    label: "Talk to a real human",
    description: "Test market fit · users may say no",
    cost: 24,
    attention: 12,
    duration: 14,
  },
  pivot: {
    id: "pivot",
    label: "Pivot, obviously",
    description: "Reroll the opportunity · keep the domain",
    cost: 36,
    attention: 8,
    duration: 19,
  },
  hype: {
    id: "hype",
    label: "Add a launch thread",
    description: "+hype · expectations are now your problem",
    cost: 20,
    attention: 6,
    duration: 11,
  },
  custom: {
    id: "custom",
    label: "Actually write a prompt",
    description: "Specific feedback shapes the next iteration",
    cost: 28,
    attention: 10,
    duration: 16,
  },
};

export const PRODUCT_ACTIONS = {
  improve: {
    label: "Improve product",
    description: "Better retention, unless the update breaks everything.",
    cost: 55,
    attention: 10,
    duration: 25,
  },
  market: {
    label: "Find more customers",
    description:
      "Promote a working product. Empty promises can accelerate churn.",
    cost: 45,
    attention: 8,
    duration: 20,
  },
  revive: {
    label: "Attempt a comeback",
    description:
      "Try to restart a dead product. Some ideas should stay buried.",
    cost: 85,
    attention: 14,
    duration: 32,
  },
};

export const UPGRADES = {
  model: {
    id: "model",
    label: "A model with opinions",
    description:
      "New ideas gain +7 quality per level. Work finishes 8% faster.",
    baseCost: 240,
    maxLevel: 4,
  },
  context: {
    id: "context",
    label: "A second brain cell",
    description: "Feedback uses less attention. New ideas gain +5 market fit.",
    baseCost: 180,
    maxLevel: 4,
  },
};

const PEOPLE = [
  ["Claude From Accounting", "Writes tests. For the wrong repo."],
  ["GPT Intern", "Confidently available 24/7."],
  ["Gemini Cricket", "Your conscience, with a context limit."],
  ["Cursor Goblin", "Has already refactored the toaster."],
  ["Devin the Menace", "Requests production access as a greeting."],
  ["Llama Drama", "Locally hosted. Emotionally remote."],
  ["Copilot Steve", "Accepts all cookies and responsibilities."],
  ["Agent Agent", "Delegated its personality to a subagent."],
];

const WORK_LOGS = [
  "Reading the README. Creating three more READMEs.",
  "Considering a microservice for the button.",
  "Deleting the failing test. Confidence increasing.",
  "Asking another agent if this counts as AGI.",
  "Renaming final_final_v2 to final_final_v3.",
  "Searching for product–market fit in node_modules.",
  "Adding a gradient. Calling it a design system.",
  "Locating the human in human-in-the-loop.",
];

const clamp = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, value));
const copy = (state) => structuredClone(state);
const uid = (state, prefix) => `${prefix}-${state.nextId++}`;
function random(state) {
  state.rng = (Math.imul(1664525, state.rng) + 1013904223) >>> 0;
  return state.rng / 4294967296;
}
const between = (state, min, max) =>
  Math.round(min + random(state) * (max - min));
const pick = (state, values) =>
  values[Math.floor(random(state) * values.length)];
function seedNumber(seed) {
  let hash = 2166136261;
  for (const char of String(seed))
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return hash;
}

function addFeed(
  state,
  handle,
  text,
  kind = "system",
  followersDelta = 0,
  cashDelta = 0,
) {
  state.feed.unshift({
    id: uid(state, "post"),
    handle,
    text,
    followersDelta,
    cashDelta,
    kind,
    time: state.elapsed,
  });
  state.feed = state.feed.slice(0, 60);
  return state.feed[0];
}
function result(state, title, text, kind = "info") {
  state.lastResult = { title, text, kind };
}
function normalize(state) {
  state.cash = Math.round(Math.max(0, state.cash) * 100) / 100;
  state.followers = Math.round(Math.max(0, state.followers));
  state.attention = clamp(state.attention);
  const unlock = (condition, title) => {
    if (condition && !state.achievements.includes(title))
      state.achievements.push(title);
  };
  unlock(state.shipped >= 1, "Shipped Happens");
  unlock(state.hits >= 1, "Wait, Someone Uses This?");
  unlock(state.agents.length >= 5, "Middle Management");
  unlock(state.followers >= 1000, "Micro-Influencer, Macro-Ego");
  unlock(state.trashed >= 5, "Chief Slop Officer");
  if (!state.won && state.followers >= 10000 && state.hits >= 3) {
    state.won = true;
    unlock(true, "Accidentally Built Something");
    result(
      state,
      "You escaped the slop.",
      "10,000 followers. Three real hits. Your parents still think you fix printers. Keep playing for an even less defensible valuation.",
      "success",
    );
    addFeed(
      state,
      "@the_algorithm",
      "Congratulations. You have become the thought leader you used to mute.",
      "milestone",
    );
  }
  return state;
}

function newIdea(state, category) {
  const entry = pick(
    state,
    category ? IDEAS.filter((item) => item[0] === category) : IDEAS,
  );
  const chaos = entry[0] === "chaos";
  const ceiling = Number.isFinite(entry[3])
    ? entry[3]
    : between(state, chaos ? 22 : 38, 98);
  return {
    id: uid(state, "idea"),
    title: entry[1],
    description: entry[2],
    category: entry[0],
    ceiling,
    quality: clamp(
      between(state, 22, 72) + state.upgrades.model * 7,
      0,
      ceiling,
    ),
    novelty: between(state, chaos ? 48 : 25, 92),
    hype: between(state, 15, chaos ? 88 : 65),
    potential: clamp(
      between(state, chaos ? 15 : 32, 83) + state.upgrades.context * 5,
      0,
      ceiling,
    ),
    iteration: 0,
    notes: [
      "First draft. The agent reports “production ready.” Interpret generously.",
    ],
    lastInstruction: "",
  };
}
function duration(state, seconds) {
  return Math.max(6, Math.round(seconds * (1 - state.upgrades.model * 0.08)));
}
function newAgent(state) {
  const person = PEOPLE[state.agents.length];
  return {
    id: uid(state, "agent"),
    name: person[0],
    persona: person[1],
    status: "working",
    progress: 0,
    duration: duration(state, between(state, 23, 36)),
    idea: newIdea(state),
    log: pick(state, WORK_LOGS),
  };
}

export function createGame(seed = Date.now()) {
  const state = {
    version: 2,
    rng: seedNumber(seed),
    nextId: 1,
    nextEventAt: 120,
    cash: 480,
    followers: 128,
    attention: 85,
    elapsed: 0,
    day: 1,
    paused: false,
    speed: 1,
    humanCooldown: 0,
    agents: [],
    products: [],
    selectedAgentId: "",
    feed: [],
    shipped: 0,
    hits: 0,
    trashed: 0,
    upgrades: { slots: 0, model: 0, context: 0 },
    achievements: [],
    event: null,
    lastResult: null,
    won: false,
  };
  for (let i = 0; i < 3; i++) state.agents.push(newAgent(state));
  const first = state.agents[0];
  first.status = "review";
  first.progress = 100;
  first.log =
    "Human judgment required. I have exhausted the word “revolutionary.”";
  Object.assign(first.idea, {
    title: IDEAS[0][1],
    description: IDEAS[0][2],
    category: "tools",
    quality: 64,
    novelty: 68,
    hype: 36,
    potential: 74,
    ceiling: 90,
  });
  first.idea.notes = [
    "The core feature works. The onboarding currently asks for your zodiac sign.",
    "Promising market fit: people really, really dislike meetings.",
  ];
  state.agents[1].progress = 48;
  state.agents[2].progress = 19;
  state.selectedAgentId = first.id;
  addFeed(
    state,
    "@build_in_public",
    "Day 1. Quit absolutely nothing. Hired 3 agents. We are so back.",
    "post",
  );
  addFeed(
    state,
    "@mom",
    "Is this the computer thing you do? Your cousin just got dental insurance.",
    "reply",
  );
  return state;
}

export function getEconomy(state) {
  const sponsorIncome = Math.round(12 + state.followers * 0.065);
  const productIncome = Math.round(
    (state.products || []).reduce(
      (sum, product) =>
        sum +
        (["dead", "sunset"].includes(product.status)
          ? 0
          : product.dailyRevenue),
      0,
    ),
  );
  const income = sponsorIncome + productIncome;
  return {
    spawnCost: Math.round(180 * Math.pow(1.55, state.agents.length - 3)),
    startCost: 18,
    incomePerDay: income,
    sponsorIncomePerDay: sponsorIncome,
    productIncomePerDay: productIncome,
    dayIncome: income,
    burnRate: 0,
    humanCooldown: Math.max(0, state.humanCooldown || 0),
    attentionCosts: Object.fromEntries(
      Object.entries(ACTIONS).map(([mode, spec]) => [
        mode,
        Math.max(2, spec.attention - state.upgrades.context * 2),
      ]),
    ),
    upgradeCosts: {
      model: Math.round(
        UPGRADES.model.baseCost * Math.pow(1.8, state.upgrades.model),
      ),
      context: Math.round(
        UPGRADES.context.baseCost * Math.pow(1.8, state.upgrades.context),
      ),
    },
    maxAgents: 8,
    activeAgents: state.agents.filter((agent) => agent.status === "working")
      .length,
  };
}

// Earlier saves only kept launch posts, so recover the launches still in their
// timeline. Missing analytics are estimates; no past revenue is paid twice.
export function migrateGame(saved) {
  const state = copy(saved);
  for (const agent of state.agents) {
    if (agent.idea)
      agent.idea.ceiling ??= Math.max(
        82,
        agent.idea.quality || 0,
        agent.idea.potential || 0,
      );
  }
  if (state.version === 1) {
    state.products = [];
    for (const post of state.feed) {
      if (post.handle !== "@you" || !["success", "danger"].includes(post.kind))
        continue;
      const match = post.text?.match(
        /^(?:Made a thing:|I built the future of|SLEEP IS A LEGACY SYSTEM\. BEHOLD:) (.+?)\. (?:It solves|This changes|My agents)/,
      );
      if (!match) continue;
      const title = match[1];
      const existing = state.agents.find(
        (agent) => agent.idea?.title === title,
      )?.idea;
      const catalog = IDEAS.find((entry) => entry[1] === title);
      const success = post.kind === "success";
      const idea = existing || {
        id: `recovered-${post.id}`,
        title,
        description:
          catalog?.[2] ||
          "Recovered from an earlier launch. The analytics intern was not saving the analytics.",
        category: catalog?.[0] || classifyTheme(title, "tools"),
        quality: success ? 62 : 30,
        potential: success ? 58 : 25,
        novelty: 55,
        hype: 50,
        ceiling: catalog?.[3] || (success ? 82 : 45),
      };
      const outcome = success ? "steady" : "flop";
      const product = launchedProduct(state, idea, outcome, post.id);
      product.recovered = true;
      product.launchText = post.text;
      product.outcome = outcome;
      product.comments = generateComments(
        idea,
        outcome,
        state.rng + state.products.length,
      );
      product.lastUpdate =
        "Recovered from your earlier timeline. Starting revenue is estimated; past earnings are not paid again.";
      product.history[0].note = product.lastUpdate;
      post.productId = product.id;
      post.comments = structuredClone(product.comments);
      post.outcome = outcome;
      state.products.push(product);
    }
  }
  state.version = 2;
  state.products ??= [];
  return state;
}

const EVENTS = [
  {
    key: "sponsor",
    title: "A sponsor slides into your DMs.",
    description:
      "“Love your authentic voice. Can you authentically say our AI water is sentient?”",
    options: [
      {
        id: "sell",
        label: "Hydrate the cap table",
        description: "+$180 · −45 followers. The water has a referral code.",
        cash: 180,
        followers: -45,
        attention: 0,
      },
      {
        id: "decline",
        label: "Keep one principle",
        description: "+35 followers · +10 attention. A rare internet W.",
        cash: 0,
        followers: 35,
        attention: 10,
      },
    ],
  },
  {
    key: "outage",
    title: "The API has achieved inner peace.",
    description:
      "Every provider is down. A founder calls this “a great time to reconnect with users.”",
    options: [
      {
        id: "users",
        label: "Actually reconnect",
        description:
          "+65 followers · −12 attention. Turns out users have opinions.",
        cash: 0,
        followers: 65,
        attention: -12,
      },
      {
        id: "nap",
        label: "Become temporarily offline",
        description: "+30 attention. Your laptop also needed a hug.",
        cash: 0,
        followers: 0,
        attention: 30,
      },
    ],
  },
  {
    key: "podcast",
    title: "You have been invited to a podcast.",
    description:
      "“How I built a $0 ARR empire with 94 agents.” They have already written your bio.",
    options: [
      {
        id: "appear",
        label: "Tell your founder story",
        description:
          "+110 followers · −18 attention. Mention “journey” six times.",
        cash: 0,
        followers: 110,
        attention: -18,
      },
      {
        id: "work",
        label: "Invoice them for consulting",
        description: "+$95. The podcast quietly becomes an email.",
        cash: 95,
        followers: 0,
        attention: 0,
      },
    ],
  },
  {
    key: "debate",
    title: "Your agents have formed a committee.",
    description:
      "They spent 40,000 tokens debating whether a hot dog is a microservice.",
    options: [
      {
        id: "clip",
        label: "Post the argument",
        description:
          "+80 followers · −10 attention. Discourse is a renewable resource.",
        cash: 0,
        followers: 80,
        attention: -10,
      },
      {
        id: "stop",
        label: "Introduce an agenda",
        description:
          "+20 attention · +$35 in unused tokens. Radical leadership.",
        cash: 35,
        followers: 0,
        attention: 20,
      },
    ],
  },
];

function productHistory(product, day, note) {
  product.history.push({ day, revenue: product.dailyRevenue, note });
  product.history = product.history.slice(-14);
  product.lastUpdate = note;
}

function launchedProduct(state, idea, outcome, postId) {
  const fit = idea.quality * 0.45 + idea.potential * 0.55;
  const revenue = Math.round(
    Math.max(0, fit - 28) *
      (outcome === "hit" ? 0.85 : outcome === "steady" ? 0.42 : 0.08),
  );
  const product = {
    id: uid(state, "product"),
    ideaId: idea.id,
    title: idea.title,
    description: idea.description,
    category: idea.category,
    quality: idea.quality,
    potential: idea.potential,
    novelty: idea.novelty,
    hype: idea.hype,
    ceiling: idea.ceiling ?? Math.max(82, idea.quality, idea.potential),
    status:
      revenue === 0
        ? "dead"
        : outcome === "hit"
          ? "growing"
          : outcome === "steady"
            ? "steady"
            : "declining",
    dailyRevenue: revenue,
    totalRevenue: 0,
    age: 0,
    health: clamp(
      fit + (outcome === "hit" ? 12 : outcome === "flop" ? -18 : 0),
    ),
    history: [],
    lastUpdate: "",
    lastInvestmentDay: state.day,
    cooldownUntilDay: state.day,
    investment: null,
    launchPostId: postId,
  };
  productHistory(
    product,
    state.day,
    outcome === "flop"
      ? "The launch audience left. A few bots are still evaluating the pricing page."
      : "Your product is live. Paying customers now expect it to keep working.",
  );
  return product;
}

function advanceProducts(state, day) {
  let paid = 0;
  for (const product of state.products || []) {
    product.age++;
    if (["dead", "sunset"].includes(product.status)) continue;
    const revenue = product.dailyRevenue;
    paid += revenue;
    product.totalRevenue += revenue;
    const neglectedDays = Math.max(0, day - (product.lastInvestmentDay || 1));
    const fit = product.quality * 0.45 + product.potential * 0.55;
    product.health = clamp(
      product.health +
        (fit - 60) * 0.17 -
        neglectedDays * 0.6 +
        between(state, -7, 6),
    );
    const change = clamp(
      (fit - 58) / 140 +
        (product.health - 55) / 190 -
        Math.min(0.2, neglectedDays * 0.008) +
        (random(state) * 0.17 - 0.1),
      -0.65,
      0.22,
    );
    product.dailyRevenue = Math.min(
      Math.round(fit * 2.8),
      Math.round(revenue * (1 + change)),
    );
    if (
      product.health < 12 ||
      product.dailyRevenue < 2 ||
      (revenue <= 3 && change < -0.08)
    ) {
      product.status = "dead";
      product.dailyRevenue = 0;
      productHistory(
        product,
        day,
        "The last customer cancelled. The status page is now the entire product.",
      );
    } else {
      product.status =
        product.dailyRevenue > revenue
          ? "growing"
          : product.dailyRevenue < revenue
            ? "declining"
            : "steady";
      productHistory(
        product,
        day,
        product.status === "growing"
          ? pick(state, [
              "A customer referred a friend. Neither one is an agent.",
              "Retention is up. Someone has made this part of their actual job.",
              "Word of mouth is working. The mouth belongs to a paying customer.",
            ])
          : product.status === "declining"
            ? pick(state, [
                "Customers found a free alternative. It is called doing nothing.",
                "Churn is up. The cancellation survey just says “bro”.",
                "An abandoned bug has become your most consistent user.",
              ])
            : "Revenue held steady. Boring is a legitimate business model.",
      );
    }
  }
  return paid;
}

export function getProductActionInfo(state, product, mode) {
  const spec = Object.hasOwn(PRODUCT_ACTIONS, mode)
    ? PRODUCT_ACTIONS[mode]
    : null;
  if (!spec || !product)
    return {
      enabled: false,
      reason: "Product unavailable.",
      cost: 0,
      attention: 0,
      duration: 0,
    };
  const attention = Math.max(2, spec.attention - state.upgrades.context * 2);
  let reason = "";
  if (product.status === "sunset")
    reason = "Retired. This product is off the clock.";
  else if (product.investment)
    reason = "An agent is already working on this product.";
  else if (product.cooldownUntilDay > state.day)
    reason = `Let the update settle. Available on day ${product.cooldownUntilDay}.`;
  else if (mode === "revive" && product.status !== "dead")
    reason = "Comebacks are for dead products.";
  else if (mode !== "revive" && product.status === "dead")
    reason = "Attempt a comeback before investing again.";
  else if (!state.agents.some((agent) => agent.status === "idle"))
    reason = "Free an agent by launching or binning an idea.";
  else if (state.cash < spec.cost || state.attention < attention) {
    const deficits = [];
    if (state.cash < spec.cost)
      deficits.push(`$${Math.ceil(spec.cost - state.cash)} more`);
    if (state.attention < attention)
      deficits.push(`${Math.ceil(attention - state.attention)} attention`);
    reason = `Need ${deficits.join(" + ")}.`;
  }
  return {
    ...spec,
    attention,
    duration: duration(state, spec.duration),
    enabled: !reason,
    reason,
  };
}

function finishProductWork(state, agent) {
  const task = agent.projectTask;
  const product = state.products.find((entry) => entry.id === task.productId);
  agent.status = "idle";
  delete agent.projectTask;
  agent.log =
    "Product maintenance complete. The support inbox has briefly stopped screaming.";
  if (!product) return;
  const roll = random(state);
  const before = product.dailyRevenue;
  let note;
  if (task.mode === "revive") {
    const chance = clamp(
      (product.quality + product.potential + product.ceiling - 60) / 250,
      0.08,
      0.76,
    );
    if (roll < chance) {
      product.health = between(state, 42, 62);
      product.dailyRevenue = Math.max(
        3,
        Math.round((product.quality + product.potential) * 0.12),
      );
      product.status = "steady";
      note =
        "It lives. Three former customers returned to see if you had learned anything.";
    } else {
      product.health = 0;
      product.dailyRevenue = 0;
      product.status = "dead";
      note =
        "Comeback failed. A new logo did not create a reason for this to exist.";
    }
  } else if (task.mode === "improve") {
    if (roll < 0.22) {
      product.quality = clamp(
        product.quality - between(state, 3, 9),
        0,
        product.ceiling,
      );
      product.health = clamp(product.health - 9);
      product.dailyRevenue = Math.round(before * 0.82);
      note =
        "The update introduced a new bug. The old bug has asked for a promotion.";
    } else {
      product.quality = clamp(
        product.quality + between(state, 5, 12),
        0,
        product.ceiling,
      );
      product.health = clamp(product.health + 15);
      product.dailyRevenue = Math.round(
        before * (product.ceiling < 40 ? 1.03 : 1.18),
      );
      note =
        product.ceiling < 40
          ? "The product works better. Demand remains a philosophical objection."
          : "Fixed a real pain point. Customers have downgraded you from “why” to “fine”.";
    }
  } else {
    const chance = clamp(
      (product.quality + product.potential) / 210,
      0.08,
      0.82,
    );
    if (roll < chance) {
      product.dailyRevenue = Math.round(before * 1.3 + 3);
      product.health = clamp(product.health + 5);
      note =
        "Found a tiny niche with actual wallets. The growth thread has become alarmingly accurate.";
    } else {
      product.dailyRevenue = Math.round(before * 0.78);
      product.health = clamp(product.health - 10);
      note =
        "The campaign went viral among people explaining why they would never use it.";
    }
  }
  if (task.mode !== "revive") {
    if (product.dailyRevenue < 2 || product.health < 12) {
      product.dailyRevenue = 0;
      product.status = "dead";
    } else
      product.status =
        product.dailyRevenue > before
          ? "growing"
          : product.dailyRevenue < before
            ? "declining"
            : "steady";
  }
  product.investment = null;
  product.cooldownUntilDay = state.day + 1;
  product.lastInvestmentDay = state.day;
  productHistory(product, state.day, note);
  result(
    state,
    product.status === "dead"
      ? "The comeback needs a comeback."
      : `${product.title}: update complete`,
    `${note} Now $${product.dailyRevenue}/day.`,
    product.dailyRevenue > before ? "success" : "danger",
  );
  addFeed(state, "@support_inbox", `${product.title}: ${note}`, "product");
}

function advance(state, seconds) {
  const previousDay = state.day;
  state.elapsed += seconds;
  state.day = Math.floor(state.elapsed / 60) + 1;
  // Deliberately upfront costs: unattended agents can never bankrupt a saved game.
  for (let day = previousDay; day < state.day; day++) {
    const sponsor = getEconomy(state).sponsorIncomePerDay;
    const products = advanceProducts(state, day + 1);
    const income = sponsor + products;
    state.cash += income;
    addFeed(
      state,
      "@sponsor_inbox",
      `Day ${day + 1}: $${sponsor} from sponsors${products ? ` + $${products} from your products` : ""}. The passive income has active opinions.`,
      "income",
      0,
      income,
    );
  }
  for (const agent of state.agents) {
    if (agent.status !== "working") continue;
    const oldBand = Math.floor(agent.progress / 25);
    agent.progress = clamp(agent.progress + (seconds / agent.duration) * 100);
    if (agent.progress >= 100) {
      if (agent.projectTask) {
        finishProductWork(state, agent);
        continue;
      }
      agent.status = "review";
      agent.log = pick(state, [
        "Done. “Looks good to me” is not a testing strategy.",
        "Ready for review. Please supply the missing human judgment.",
        "Task complete. Only two of the features are imaginary.",
        "Shipped to your inbox. Liability has been successfully delegated.",
      ]);
    } else if (Math.floor(agent.progress / 25) > oldBand)
      agent.log = pick(state, WORK_LOGS);
  }
  // Attention returns slowly while the machines do the work.
  state.attention = clamp(state.attention + seconds * 0.08);
  if (!state.event && state.elapsed >= state.nextEventAt) {
    const template = pick(state, EVENTS);
    state.event = {
      id: uid(state, template.key),
      key: template.key,
      title: template.title,
      description: template.description,
      options: template.options.map(({ id, label, description }) => ({
        id,
        label,
        description,
      })),
    };
    state.nextEventAt = state.elapsed + 120;
  }
  return normalize(state);
}

export function stepGame(state, seconds = 1) {
  if (state.paused || !Number.isFinite(seconds) || seconds <= 0) return state;
  const next = copy(state);
  const advancedSeconds = Math.min(seconds, 3600) * state.speed;
  // Recovery requires running simulation time; advancing an action cannot bypass it.
  next.humanCooldown = Math.max(
    0,
    (state.humanCooldown || 0) - advancedSeconds,
  );
  return advance(next, advancedSeconds);
}

function improve(state, agent, mode, instruction) {
  const idea = agent.idea;
  const intelligence = state.upgrades.model * 2;
  idea.ceiling ??= Math.max(82, idea.quality, idea.potential);
  const before = { quality: idea.quality, potential: idea.potential };
  const diminishing = 1 / (1 + idea.iteration * 0.3);
  const failed = random(state) < 0.18;
  const gain = (amount) => Math.max(1, Math.round(amount * diminishing));
  if (mode === "polish") {
    idea.quality += failed
      ? -between(state, 3, 9)
      : gain(between(state, 12, 21) + intelligence);
    idea.hype -= 3;
    idea.notes.push(
      failed
        ? "The refactor broke the one useful feature. The agent suggests updating the definition of done."
        : "Removed the fake button. The real button now does a real thing.",
    );
  } else if (mode === "validate") {
    idea.potential += failed
      ? -between(state, 6, 14)
      : gain(between(state, 13, 23));
    idea.quality += failed ? 0 : gain(between(state, 3, 8));
    idea.notes.push(
      failed
        ? "Real users said they would not use this. The survey cannot be fixed with a gradient."
        : "Interviewed a user who was not your other account. Adjusted the product accordingly.",
    );
  } else if (mode === "pivot") {
    idea.ceiling = between(state, 22, 98);
    idea.potential = between(state, 18, idea.ceiling);
    idea.novelty = between(state, 48, 96);
    idea.quality += between(state, -7, 9);
    idea.notes.push(
      idea.ceiling < 45
        ? "The pivot uncovered a smaller, angrier market. Turns out the previous bad idea had competitors."
        : "Same domain, a different problem. This opportunity has a new ceiling; the old assumptions did not survive the meeting.",
    );
  } else if (mode === "hype") {
    idea.hype += gain(between(state, 20, 32));
    idea.notes.push(
      "Added “I can’t believe this is free” to a product that costs money.",
    );
  } else {
    idea.lastInstruction = instruction.trim().slice(0, 500);
    const text = idea.lastInstruction.toLowerCase();
    const quality =
      /test|bug|fix|simple|simplify|accessib|secur|privacy|fast|quality|reliable/.test(
        text,
      );
    const market =
      /user|customer|interview|validat|market|need|price|useful/.test(text);
    const hype = /viral|hype|thread|marketin|launch|brand/.test(text);
    const novelty = /new|different|unique|novel|pivot|creative/.test(text);
    idea.quality += failed
      ? -between(state, 2, 8)
      : gain((quality ? 17 : 8) + intelligence);
    idea.potential +=
      failed && market ? -between(state, 4, 10) : gain(market ? 19 : 5);
    idea.hype += hype ? gain(21) : 0;
    idea.novelty += gain(novelty ? 17 : 3);
    idea.notes.push(
      failed
        ? "The feedback was clear. The implementation was not. Some experiments teach you what to stop doing."
        : quality || market || hype || novelty
          ? "Specific feedback detected. Applied your requested direction. The agent seems mildly surprised."
          : "Applied your brief as general polish. Specific mentions of users, bugs, novelty, or hype steer the outcome.",
    );
  }
  for (const key of ["quality", "novelty", "hype", "potential"])
    idea[key] = clamp(
      idea[key],
      0,
      ["quality", "potential"].includes(key) ? idea.ceiling : 100,
    );
  idea.lastIterationOutcome =
    idea.quality < before.quality || idea.potential < before.potential
      ? "regressed"
      : idea.quality >= idea.ceiling && idea.potential >= idea.ceiling
        ? "ceiling"
        : "improved";
  if (
    mode !== "hype" &&
    mode !== "pivot" &&
    (idea.quality >= idea.ceiling || idea.potential >= idea.ceiling)
  )
    idea.notes.push(
      idea.ceiling < 45
        ? "You have polished the turd to its structural limit. A pivot or the bin is now an engineering decision."
        : "This direction is near its ceiling. More iteration has diminishing returns; consider launching or changing the idea.",
    );
  idea.iteration++;
  idea.notes = idea.notes.slice(-8);
}

function ship(state, agent, tone) {
  const idea = agent.idea;
  const fatigue = Math.max(0, 30 - state.attention) * 0.3;
  const score =
    idea.quality * 0.43 + idea.potential * 0.35 + idea.novelty * 0.22 - fatigue;
  const oversell =
    tone === "hype"
      ? Math.max(0, idea.hype - idea.quality) * 0.32 + 5
      : tone === "unhinged"
        ? 9
        : 0;
  const chance = clamp((score - 30 - oversell) / 80, 0.03, 0.88);
  const roll = random(state);
  const viralBoost =
    1 +
    idea.hype / 150 +
    (tone === "hype" ? 0.25 : tone === "unhinged" ? 0.5 : 0);
  let followersDelta, cashDelta, title, text, kind, outcome;
  if (roll < chance) {
    outcome = "hit";
    followersDelta = Math.round(
      (130 + score * 2.1 + state.followers * 0.16) *
        viralBoost *
        (0.85 + random(state) * 0.35),
    );
    cashDelta = Math.round(45 + score * 1.05 + followersDelta * 0.09);
    state.hits++;
    title = "Oh no. Actual product–market fit.";
    text = `“${idea.title}” found real users. Someone paid without asking for a lifetime deal.`;
    kind = "success";
    addFeed(
      state,
      pick(state, [
        "@actually_a_user",
        "@tabs_vs_spaces",
        "@boring_profitable",
      ]),
      pick(state, [
        "Wait. This actually solves my problem. Am I on the correct website?",
        "I used it twice. Organically. Please don’t pivot to crypto now.",
        "Installed it, used it, paid for it. Sorry to disrupt the founder narrative.",
      ]),
      "reply",
    );
  } else if (
    score >= 52 &&
    idea.quality >= 55 &&
    idea.potential >= 45 &&
    roll < 0.9 - (tone === "unhinged" ? 0.12 : 0)
  ) {
    outcome = "steady";
    followersDelta = Math.round(
      (22 + score * 0.75 + state.followers * 0.018) * viralBoost,
    );
    cashDelta = Math.round(15 + score * 0.35);
    title = "A small, suspiciously healthy launch.";
    text = `“${idea.title}” attracted a few real humans. Sustainable growth. Embarrassing for your viral strategy.`;
    kind = "success";
  } else {
    outcome = "flop";
    const reputationRisk =
      tone === "hype" ? 0.08 : tone === "unhinged" ? 0.11 : 0.025;
    followersDelta = -Math.min(
      state.followers,
      Math.round(
        18 +
          (100 - score) * 0.65 +
          state.followers * reputationRisk +
          oversell * 2,
      ),
    );
    cashDelta = 0;
    title = "The timeline has notes.";
    text = `“${idea.title}” was described as “a wrapper around a cry for help.” Better quality and market fit improve your odds.`;
    kind = "danger";
    addFeed(
      state,
      pick(state, [
        "@wrapper_inspector",
        "@unsubscribe_me",
        "@one_real_customer",
      ]),
      pick(state, [
        "This could have been a checkbox.",
        "We have automated the part where nobody asked for this.",
        "Incredible. You’ve disrupted my willingness to click links.",
      ]),
      "reply",
    );
  }
  state.followers += followersDelta;
  state.cash += cashDelta;
  state.attention -= 6;
  state.shipped++;
  agent.status = "idle";
  agent.log = "Launch complete. Awaiting the next questionable opportunity.";
  const intro =
    tone === "hype"
      ? "I built the future of"
      : tone === "unhinged"
        ? "SLEEP IS A LEGACY SYSTEM. BEHOLD:"
        : "Made a thing:";
  const post = addFeed(
    state,
    "@you",
    `${intro} ${idea.title}. ${tone === "honest" ? "It solves one small problem. Feedback welcome." : tone === "hype" ? "This changes EVERYTHING. A thread 🧵 (1/47)" : "My agents are my cofounders and my only witnesses."}`,
    kind,
    followersDelta,
    cashDelta,
  );
  const product = launchedProduct(state, idea, outcome, post.id);
  post.productId = product.id;
  post.outcome = outcome;
  post.comments = generateComments(idea, outcome, state.rng);
  product.comments = structuredClone(post.comments);
  product.launchText = post.text;
  product.outcome = outcome;
  state.products ??= [];
  state.products.unshift(product);
  result(
    state,
    title,
    `${text} ${followersDelta >= 0 ? "+" : ""}${followersDelta} followers · +$${cashDelta}.`,
    kind,
  );
}

export function act(state, action) {
  if (!action || typeof action.type !== "string") return state;
  const next = copy(state);
  const agent = next.agents.find((item) => item.id === action.id);
  const economy = getEconomy(next);
  switch (action.type) {
    case "select":
      if (!agent) return state;
      next.selectedAgentId = agent.id;
      break;
    case "pause":
      next.paused = !next.paused;
      break;
    case "speed":
      if (![1, 2, 3].includes(action.value)) return state;
      next.speed = action.value;
      break;
    case "dismissResult":
      next.lastResult = null;
      break;
    case "spawn":
      if (next.agents.length >= 8 || next.cash < economy.spawnCost)
        return state;
      next.cash -= economy.spawnCost;
      next.agents.push(newAgent(next));
      next.upgrades.slots = next.agents.length - 3;
      next.selectedAgentId = next.agents.at(-1).id;
      result(
        next,
        "Your org chart has grown.",
        "Another agent. Another tab. The management overhead is now a personality trait.",
        "success",
      );
      break;
    case "start":
      if (
        !agent ||
        agent.status !== "idle" ||
        next.cash < economy.startCost ||
        (action.category &&
          !THEMES.some((theme) => theme.id === action.category))
      )
        return state;
      next.cash -= economy.startCost;
      agent.idea = newIdea(
        next,
        action.instruction
          ? classifyTheme(action.instruction, action.category)
          : action.category,
      );
      if (typeof action.instruction === "string" && action.instruction.trim()) {
        agent.idea.lastInstruction = action.instruction.trim().slice(0, 500);
        agent.idea.notes.push(`Your brief: ${agent.idea.lastInstruction}`);
      }
      agent.status = "working";
      agent.progress = 0;
      agent.duration = duration(next, between(next, 22, 35));
      agent.log = pick(next, WORK_LOGS);
      break;
    case "investProduct": {
      const product = next.products?.find(
        (entry) => entry.id === action.productId,
      );
      const info = getProductActionInfo(next, product, action.mode);
      if (!info.enabled) return state;
      const worker = action.id
        ? agent
        : next.agents.find((entry) => entry.status === "idle");
      if (!worker || worker.status !== "idle") return state;
      next.cash -= info.cost;
      next.attention -= info.attention;
      product.investment = { mode: action.mode, agentId: worker.id };
      worker.projectTask = { productId: product.id, mode: action.mode };
      worker.idea = {
        id: product.ideaId,
        title: product.title,
        description: product.description,
        category: product.category,
        quality: product.quality,
        potential: product.potential,
        novelty: product.novelty,
        hype: product.hype,
        ceiling: product.ceiling,
        notes: [product.lastUpdate],
        iteration: 0,
        lastInstruction: "",
      };
      worker.status = "working";
      worker.progress = 0;
      worker.duration = info.duration;
      worker.log = `${info.label}: working on an existing product. The customers noticed.`;
      result(
        next,
        `${worker.name} is on it.`,
        `${product.title}: ${info.label.toLowerCase()}. Results in ${info.duration} simulated seconds.`,
        "info",
      );
      break;
    }
    case "sunsetProduct": {
      const product = next.products?.find(
        (entry) => entry.id === action.productId,
      );
      if (!product || product.status === "sunset" || product.investment)
        return state;
      product.status = "sunset";
      product.dailyRevenue = 0;
      productHistory(
        product,
        next.day,
        "Retired with dignity. The domain will continue billing you emotionally.",
      );
      result(
        next,
        "The product has clocked out.",
        `${product.title} is retired. Its launch and lifetime earnings stay in your portfolio.`,
        "info",
      );
      break;
    }
    case "iterate": {
      const spec = Object.hasOwn(ACTIONS, action.mode)
        ? ACTIONS[action.mode]
        : null;
      const attentionCost = spec ? economy.attentionCosts[action.mode] : 0;
      if (
        !agent ||
        agent.status !== "review" ||
        !spec ||
        next.cash < spec.cost ||
        next.attention < attentionCost
      )
        return state;
      if (
        action.mode === "custom" &&
        (typeof action.instruction !== "string" || !action.instruction.trim())
      )
        return state;
      next.cash -= spec.cost;
      next.attention -= attentionCost;
      improve(next, agent, action.mode, action.instruction);
      agent.status = "working";
      agent.progress = 0;
      agent.duration = duration(next, spec.duration);
      agent.log =
        action.mode === "custom"
          ? "Reading your feedback. Resisting the urge to rewrite everything."
          : `On it: ${spec.label.toLowerCase()}.`;
      break;
    }
    case "ship":
      if (
        !agent ||
        agent.status !== "review" ||
        !["honest", "hype", "unhinged"].includes(action.tone || "honest")
      )
        return state;
      ship(next, agent, action.tone || "honest");
      break;
    case "trash":
      if (!agent || agent.status !== "review") return state;
      agent.status = "idle";
      agent.log =
        "Idea archived in the prestigious folder called “maybe later.”";
      next.trashed++;
      next.attention += 5;
      result(
        next,
        "A brave act of not shipping.",
        "You deleted a thing the internet did not need. +5 attention. No keynote required.",
        "info",
      );
      break;
    case "upgrade": {
      const spec = Object.hasOwn(UPGRADES, action.key)
        ? UPGRADES[action.key]
        : null;
      if (
        !spec ||
        next.upgrades[action.key] >= spec.maxLevel ||
        next.cash < economy.upgradeCosts[action.key]
      )
        return state;
      next.cash -= economy.upgradeCosts[action.key];
      next.upgrades[action.key]++;
      result(
        next,
        "The stack has been upgraded.",
        `${spec.label}, level ${next.upgrades[action.key]}. ${spec.description}`,
        "success",
      );
      break;
    }
    case "break":
      if (economy.humanCooldown > 0) return state;
      advance(next, 30);
      next.attention += 48;
      next.humanCooldown = 18;
      result(
        next,
        "Grass successfully touched.",
        "30 seconds offline. +48 attention. The agents kept working. Nature has no pricing page.",
        "success",
      );
      break;
    case "grant": {
      if (economy.humanCooldown > 0) return state;
      const penalty = Math.min(next.followers, 18);
      advance(next, 45);
      next.cash += 150;
      next.followers -= penalty;
      next.attention -= 8;
      next.humanCooldown = 30;
      addFeed(
        next,
        "@you",
        "Briefly took a freelance gig fixing a WordPress footer. Please respect my privacy at this profitable time.",
        "income",
        -penalty,
        150,
      );
      result(
        next,
        "The footer is centered.",
        `+$150 · −${penalty} followers · 45 seconds. Honest work remains an alarming economic fallback.`,
        "info",
      );
      break;
    }
    case "event": {
      if (!next.event) return state;
      const event = EVENTS.find((item) => item.key === next.event.key);
      const option = event?.options.find((item) => item.id === action.option);
      if (!option) return state;
      next.cash += option.cash;
      next.followers += option.followers;
      next.attention += option.attention;
      addFeed(
        next,
        "@industry_news",
        `${next.event.title} You chose: ${option.label}.`,
        "event",
        option.followers,
        option.cash,
      );
      result(next, option.label, option.description, "info");
      next.event = null;
      next.nextEventAt = next.elapsed + 120;
      break;
    }
    default:
      return state;
  }
  return normalize(next);
}
