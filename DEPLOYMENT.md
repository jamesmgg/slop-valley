# Private deployment

The canonical deployment is the `slop-valley` Compose project, service `web`, image `slop-valley:local`, listening on `127.0.0.1:8790`. Run Docker commands from this repository on the host running Docker Desktop.

```sh
docker compose up -d --build web
docker compose ps -a
curl http://127.0.0.1:8790/health
```

## Tailscale

Keep Docker loopback-bound and forward a tailnet-only TCP listener to it. Inspect current routes before changing them:

```sh
tailscale serve status
tailscale serve --bg --tcp=8790 tcp://127.0.0.1:8790
tailscale serve status
tailscale ip -4
```

Players on the same authorized tailnet can open `http://<tailscale-ip>:8790`. Access is controlled by the tailnet's existing device membership and ACL policy. Do not enable Funnel; the game does not need public internet exposure.

To remove only this game's Tailscale listener:

```sh
tailscale serve --tcp=8790 off
```

The host address observed during setup was `100.72.181.81`; use the current output of `tailscale ip -4` after host or tailnet changes. Existing routes on other ports must remain intact.

## State and lifecycle

Game saves live in browser local storage, scoped by origin. `http://localhost:8790` and the Tailscale URL have different saves. Rebuilding or replacing the container does not erase a browser's save. Clearing site data does.

The storage key remains `slop-valley-save-v1`; version-one saves migrate to the expanded format when opened. Launches still present in the saved timeline are recovered as products with estimated starting revenue and generated discussions. Migration does not award past earnings. Products, their revenue history, investments, and comments stay in the same browser save.

One application container is sufficient. Reuse the same Compose service for rebuilds. The service has a read-only root filesystem, temporary nginx write directories, a health endpoint, and bounded log rotation. There are no database files, Docker socket mounts, volumes, API keys, or external paid services.

## Optional on-device writing

Local Gemini is a browser capability, not a Docker service. Players explicitly enable it in settings; Chrome may then download Gemini Nano. It needs supported desktop Chrome, an available Prompt API, and localhost or HTTPS. The existing tailnet HTTP route intentionally continues to use the complete canned-content fallback. No additional route, server dependency, or API key is needed to play the expanded game. Opening localhost to try local AI uses that origin's separate save.
