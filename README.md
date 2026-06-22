# WebSheep

A web-based fractal flame screensaver — Electric Sheep for the browser era.

Open `index.html` over a local HTTP server. Press `F` for fullscreen. Press `?` for help.

## Running

```bash
python3 -m http.server 5173
# then open http://localhost:5173/
```

Any static HTTP server works. Must be served over HTTP (not file://) for ES module imports.

## Controls

| Key | Action |
|---|---|
| `F` | fullscreen |
| `→` / `Space` | next sheep |
| `←` | previous sheep |
| `↑` | vote up |
| `↓` | vote down |
| `M` | mutate (spawn a child sheep) |
| `Shift+M` / `X` | crossover with random sheep |
| `P` | pause animation |
| `R` | reset accumulator |
| `?` | toggle help |

## Architecture (this MVP)

- `index.html` — single self-contained page with inline GLSL shaders + JS
- `src/sheep-pool.js` — 8 hand-tuned starter sheep genomes
- `src/evolution.js` — client-side mutation + crossover operators

Renderer:
- WebGL2 fragment-shader monte carlo: each vertex of a 256×256 = 65,536-point grid runs 4 IFS iterations per frame
- 4 multi-passes per frame (one per stored iteration) — yields ~260k samples/frame
- Accumulator: 1024×1024 RGBA16F ping-pong float framebuffer
- Display: fullscreen quad samples accumulator, applies log-density → palette lookup → gamma

This proves the whole idea (rendering + GA loop) works without a server. The next phase adds a server + SSE so sheep evolve across clients.

## Roadmap

See `~/Obsidian/ideas/websheep-spec.md` and `~/Obsidian/ideas/websheep-rendering.md` for the full design.
