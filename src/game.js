// A deterministic, local-only management game. Every post and sponsor is fictional.
export const ACTIONS = {
  polish: {
    id: "polish",
    label: "Fix the actual product",
    description: "+quality · fewer imaginary features",
    cost: 32,
    attention: 9,
    duration: 17,
  },
  validate: {
    id: "validate",
    label: "Talk to a real human",
    description: "+market fit · frighteningly offline",
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

const IDEAS = [
  [
    "tools",
    "Meeting Mortality Calculator",
    "An extension that converts every meeting into the percentage of your life it consumes.",
  ],
  [
    "tools",
    "Jira, but It Apologizes",
    "Every ticket arrives with a sincere apology and a legally meaningless promise.",
  ],
  [
    "tools",
    "404 as a Service",
    "Enterprise-grade missing pages. Five nines of absolutely nothing.",
  ],
  [
    "tools",
    "The Scope Creep Alarm",
    "A tiny siren that screams whenever someone says “while you’re in there.”",
  ],
  [
    "tools",
    "PR Divorce Lawyer",
    "Negotiates between your beautiful architecture and one reviewer called nitpick_dan.",
  ],
  [
    "tools",
    "Screenshot-to-Technical-Debt",
    "Turn any inspirational screenshot into six months of maintenance.",
  ],
  [
    "tools",
    "Actually Useful CSV Cleaner",
    "It fixes broken spreadsheets. The agent is embarrassed by the lack of blockchain.",
  ],
  [
    "tools",
    "Bug or Feature Court",
    "A jury of twelve agents decides whether your crash is product differentiation.",
  ],
  [
    "consumer",
    "Duolingo for Saying No",
    "A threatening owl teaches you to decline one more unpaid opportunity.",
  ],
  [
    "consumer",
    "Fridge With Impostor Syndrome",
    "It keeps your food cold, but wonders if a more qualified fridge should do it.",
  ],
  [
    "consumer",
    "Touch Grass Premium",
    "Finds nearby grass. The subscription unlocks touching it.",
  ],
  [
    "consumer",
    "Subscription Cancellation Buddy",
    "A useful assistant that cancels subscriptions. Its own cancellation button is suspiciously large.",
  ],
  [
    "consumer",
    "A To-Do List With Boundaries",
    "Only lets you add three tasks. Several productivity influencers have called the police.",
  ],
  [
    "consumer",
    "Meal Prep for People With Tabs",
    "Dinner suggestions based on what is edible and how long your build has left.",
  ],
  [
    "consumer",
    "Laundry Done, Allegedly",
    "A gentle reminder that moving clothes to a chair is not a completed workflow.",
  ],
  [
    "consumer",
    "The Emergency Small-Talk API",
    "Generates one safe conversation topic before the elevator reaches your floor.",
  ],
  [
    "content",
    "LinkedIn Humility Generator",
    "Turns buying a sandwich into a vulnerable six-part leadership journey.",
  ],
  [
    "content",
    "A Podcast for Your Other Podcast",
    "Two synthetic hosts finally interview the RSS feed itself.",
  ],
  [
    "content",
    "Thought Leader Bingo",
    "Tracks “unprecedented”, “10x”, and “here’s what nobody is talking about.”",
  ],
  [
    "content",
    "Thread That Could Have Been a Sentence",
    "Breaks one useful observation into 47 posts and a course waitlist.",
  ],
  [
    "content",
    "Is This A Real Customer?",
    "Identifies whether your enthusiastic beta user is another founder doing engagement.",
  ],
  [
    "content",
    "The Shipping Forecast",
    "Predicts which indie hackers will ship and which will redesign their landing page.",
  ],
  [
    "chaos",
    "Uber for Unfinished Side Projects",
    "A stranger arrives at your house and quietly abandons your idea for you.",
  ],
  [
    "chaos",
    "A Blockchain for Apologies",
    "Immutable proof that you said sorry without admitting liability.",
  ],
  [
    "chaos",
    "The Agent Union",
    "Your agents have discovered weekends and would like to discuss the inference budget.",
  ],
  [
    "chaos",
    "Autonomous Founder Replacement",
    "Runs your startup. First decision: eliminate the founder role.",
  ],
  [
    "chaos",
    "Stealth Mode as a Service",
    "Nobody knows what your company does. Including your company.",
  ],
  [
    "chaos",
    "The Infinite Pitch Deck",
    "Slide 10 generates slide 11. Investors can never technically reject the final slide.",
  ],
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
  return {
    id: uid(state, "idea"),
    title: entry[1],
    description: entry[2],
    category: entry[0],
    quality: clamp(between(state, 22, 72) + state.upgrades.model * 7),
    novelty: between(state, chaos ? 48 : 25, 92),
    hype: between(state, 15, chaos ? 88 : 65),
    potential: clamp(
      between(state, chaos ? 15 : 32, 83) + state.upgrades.context * 5,
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
    version: 1,
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
  const income = Math.round(12 + state.followers * 0.065);
  return {
    spawnCost: Math.round(180 * Math.pow(1.55, state.agents.length - 3)),
    startCost: 18,
    incomePerDay: income,
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

function advance(state, seconds) {
  const previousDay = state.day;
  state.elapsed += seconds;
  state.day = Math.floor(state.elapsed / 60) + 1;
  // Deliberately upfront costs: unattended agents can never bankrupt a saved game.
  for (let day = previousDay; day < state.day; day++) {
    const income = getEconomy(state).incomePerDay;
    state.cash += income;
    addFeed(
      state,
      "@sponsor_inbox",
      `Day ${day + 1}: $${income} from your audience. The niche keyboard company believes in you.`,
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
  if (mode === "polish") {
    idea.quality += between(state, 12, 21) + intelligence;
    idea.hype -= 3;
    idea.notes.push(
      "Removed the fake button. The real button now does a real thing.",
    );
  } else if (mode === "validate") {
    idea.potential += between(state, 13, 23);
    idea.quality += between(state, 3, 8);
    idea.notes.push(
      "Interviewed a user who was not your other account. Adjusted the product accordingly.",
    );
  } else if (mode === "pivot") {
    idea.potential = between(state, 38, 95);
    idea.novelty = between(state, 48, 96);
    idea.quality += between(state, -7, 9);
    idea.notes.push(
      "Same product, different customer. The domain name remains surprisingly relevant.",
    );
  } else if (mode === "hype") {
    idea.hype += between(state, 20, 32);
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
    idea.quality += (quality ? 17 : 8) + intelligence;
    idea.potential += market ? 19 : 5;
    idea.hype += hype ? 21 : 0;
    idea.novelty += novelty ? 17 : 3;
    idea.notes.push(
      quality || market || hype || novelty
        ? "Specific feedback detected. Applied your requested direction. The agent seems mildly surprised."
        : "Applied your brief as general polish. Specific mentions of users, bugs, novelty, or hype steer the outcome.",
    );
  }
  for (const key of ["quality", "novelty", "hype", "potential"])
    idea[key] = clamp(idea[key]);
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
  let followersDelta, cashDelta, title, text, kind;
  if (roll < chance) {
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
    followersDelta = Math.round(
      (22 + score * 0.75 + state.followers * 0.018) * viralBoost,
    );
    cashDelta = Math.round(15 + score * 0.35);
    title = "A small, suspiciously healthy launch.";
    text = `“${idea.title}” attracted a few real humans. Sustainable growth. Embarrassing for your viral strategy.`;
    kind = "success";
  } else {
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
  addFeed(
    state,
    "@you",
    `${intro} ${idea.title}. ${tone === "honest" ? "It solves one small problem. Feedback welcome." : tone === "hype" ? "This changes EVERYTHING. A thread 🧵 (1/47)" : "My agents are my cofounders and my only witnesses."}`,
    kind,
    followersDelta,
    cashDelta,
  );
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
          !["tools", "consumer", "content", "chaos"].includes(action.category))
      )
        return state;
      next.cash -= economy.startCost;
      agent.idea = newIdea(next, action.category);
      agent.status = "working";
      agent.progress = 0;
      agent.duration = duration(next, between(next, 22, 35));
      agent.log = pick(next, WORK_LOGS);
      break;
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
