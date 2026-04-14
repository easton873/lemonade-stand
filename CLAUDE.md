# Lemonade Stand Simulator

## Project Overview

A browser-based business simulation game built with vanilla HTML, CSS, and JavaScript. Players run a lemonade stand over multiple days, making decisions about inventory, pricing, recipe ratios, and advertising to maximize profit.

## Architecture

Game logic lives in `game.js` (ES module); the UI layer lives in `index.html`.

**`game.js`** — all constants, the `G` state object, and every pure/game-logic function (exported). No DOM access.

**`index.html`** — imports from `game.js`, contains all render functions and event handlers. Uses `<script type="module">`. Inline `onclick` handlers work because event handler functions are exposed via `Object.assign(window, {...})` at startup.

**State management:** A single mutable object `G` (exported from `game.js`) holds all game state (money, inventory, reputation, day count, etc.). The entire UI re-renders on each state change via `render()`. Tests reset state between runs with `resetState()`.

## Running the Game

No build required. Just open the file in a browser:

```bash
open index.html
# or serve locally:
python -m http.server 8000
# then visit http://localhost:8000
```

## Testing

```bash
npm install       # first time only
npm test          # run all tests once
npm run test:watch  # watch mode
```

Tests live in `game.test.js` and use [Vitest](https://vitest.dev/). They cover the pure game-logic functions in `game.js` — pricing, bulk discounts, reputation math, recipe quality, inventory operations, and ad tier aggregation. Tests set up `G` directly and call `resetState()` in `beforeEach` to isolate state.

## Key Game Systems

- **Weather:** 8 types (scorching → stormy) that modify customer demand
- **Recipe quality:** Evaluated on tartness and richness; affects demand and reputation
- **Reputation:** Built through advertising, recipe quality, fair pricing, and supply reliability
- **Locations:** City (high traffic, less price-sensitive) vs. Country (lower traffic, price-sensitive)
- **Bulk discounts:** Price breaks at 100, 500, 1000, and 5000 units
- **Inventory expiry:** Lemons expire in 7 days, ice expires in 1 day, sugar in 90 days

## Debug Mode

A `debugMode` flag is accessible via the browser console. It exposes money cheat buttons for testing edge cases without playing through the full game loop.

## Development Notes

- All styling is in the `<style>` tag using CSS custom properties, Grid, and Flexbox
- DOM updates use `innerHTML` with template literals — no virtual DOM or diffing
- Game logic has no browser dependencies — safe to import in Node for testing
- Emojis are used extensively as UI icons — preserve them when editing UI strings
