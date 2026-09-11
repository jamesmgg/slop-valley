# Slop Valley

A satirical browser game about becoming the world's most confidently overwhelmed agentic engineer.

Run a growing stable of AI agents, review their suspiciously enthusiastic ideas, give feedback, and decide what deserves to ship. The audience on a simulated X rewards useful products and occasionally punishes spectacular nonsense. Followers attract sponsorship money, which buys more parallel agents, which produces more work for the one component that still cannot scale: you.

## Play

- Start agents and let their ideas develop in parallel.
- Review finished work, iterate with quick actions or your own feedback, then decide when to publish.
- Balance audience trust, cash, and compute costs while expanding your agent team.
- Reach 10,000 followers and three breakout launches, then continue in endless mode.

Press **Space** to pause/resume and **1–8** to select an agent. Reopening a saved career starts paused. Dialogs and hidden tabs pause the simulation. Touching grass restores attention; freelancing rescues your budget. These human actions share a cooldown, which runs while the simulation is playing.

Custom prompts steer the local simulation through recognizable directions such as “fix bugs,” “simplify,” “interview users,” “pivot,” and “make it viral.” There is no external language model behind the prompt box.

This is a self-contained simulation. It does not call paid AI APIs, post to X, or use real sponsorships. Progress stays in the current browser's local storage; using a different browser or address creates a separate save.

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

Browser tests use the running Docker endpoint and locally installed Chrome. To use Playwright Chromium instead, run `npx playwright install chromium` and set `PLAYWRIGHT_CHANNEL=chromium`. Set `GAME_URL` to test another address. Tests cover the full play loop, simulation speed, persistence, events, and mobile layout.

The production service binds only to the host's loopback interface. See [DEPLOYMENT.md](DEPLOYMENT.md) for private Tailscale access.
