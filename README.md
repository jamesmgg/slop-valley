# Slop Valley

A satirical browser game about becoming the world's most confidently overwhelmed agentic engineer.

Run a growing stable of AI agents, review their suspiciously enthusiastic ideas, give feedback, and decide what deserves to ship. The audience on a simulated X rewards useful products and occasionally punishes spectacular nonsense. Followers attract sponsorship money, which buys more parallel agents, which produces more work for the one component that still cannot scale: you.

## Play

- Start agents and let their ideas develop in parallel.
- Review finished work, iterate with quick actions or your own feedback, then decide when to publish.
- Keep launched products in **Products**, collect recurring income, and put idle agents to work on improvements, customer acquisition, or a comeback.
- Open a launch post or its product's discussion to read five replies from the simulated internet.
- Balance audience trust, cash, and compute costs while expanding your agent team.
- Reach 10,000 followers and three breakout launches, then continue in endless mode.

Press **Space** to pause/resume and **1–8** to select an agent. Reopening a saved career starts paused. Dialogs and hidden tabs pause the simulation. Touching grass restores attention; freelancing rescues your budget. These human actions share a cooldown, which runs while the simulation is playing.

The dark workbench keeps resource balances, agent statuses, and review decisions together. Agent cards lead with the product they are working on. **Next ready** (or **N**) cycles through agents waiting for a review. Enable **Auto-switch after feedback** to move directly to another ready agent after delegating, launching, or binning an idea. Draft prompts stay with their ideas when switching agents.

On mobile, the bottom navigation keeps the workbench, timeline, and products within reach; **More** holds additional controls. The persistent action bar keeps shipping and the next review close. Feedback buttons show their effect, cash/attention cost, completion time, and a reason when unavailable. Agent notes expand separately from the main decisions.

One game day is 60 simulation seconds. Products earn income each day, then grow, hold steady, decline, or lose their last customer. Their cards show revenue history and health. Improvement and marketing spend cash, attention, and an idle agent's time; revival is a gamble. Retiring a product stops income and investment while keeping its history. Some concepts have hard ceilings, and iterations can backfire: more polish cannot manufacture demand.

The built-in library contains **168 ideas across 12 themes**, including 36 deliberately bad bets, plus **184 comment patterns** tied to themes, product names, and launch outcomes. Custom briefs select themes through keywords; feedback recognizes directions such as “fix bugs,” “simplify,” “interview users,” “pivot,” and “make it viral.” Distinct synthesized sounds mark completed work, wins, failures, income, events, investment, rest, and discarded ideas; sound remains optional.

## Optional local Gemini

In settings, choose **Enable local Gemini** to let supported desktop Chrome generate fresh idea descriptions, custom-feedback revisions, and launch replies on the device. Enabling it may let Chrome download Gemini Nano. It requires an available Chrome Prompt API on localhost or HTTPS; the normal Tailscale HTTP address uses the full built-in library. If the model is unavailable, busy, or returns unusable text, play continues with canned content. AI changes the writing, while the game engine controls money, scores, and outcomes.

This is a self-contained simulation. It does not call paid AI APIs, post to X, or use real sponsorships. Progress stays in the current browser's local storage; using a different browser or address creates a separate save. Existing version-one saves keep the same storage key and migrate recent launches still present in their timeline into products. Their initial revenue is estimated; past earnings are not paid again.

## Run in Docker

```sh
docker compose up -d --build web
```

Open <http://localhost:8790>. The production image builds the React app with Node 24 and serves the resulting static files with nginx. There is one Compose service, no database, and no persistent Docker volume.

```sh
docker compose ps
docker compose logs --tail=100 web
curl http://127.0.0.1:8790/health
```

Rebuild with the same `docker compose up -d --build web` command. It replaces the existing service. Stop it with `docker compose stop web`.

## Development

```sh
npm ci
npm run dev
npm run build
npm test
npm run test:e2e
```

Browser tests use the running Docker endpoint and locally installed Chrome. To use Playwright Chromium instead, run `npx playwright install chromium` and set `PLAYWRIGHT_CHANNEL=chromium`. Set `GAME_URL` to test another address. Tests cover the play loop, products and discussions, simulation speed, persistence, events, and mobile layout. Unit tests cover the economy, content, migration, sound cues, and local-AI fallback behavior.

The production service binds only to the host's loopback interface. See [DEPLOYMENT.md](DEPLOYMENT.md) for private Tailscale access.
