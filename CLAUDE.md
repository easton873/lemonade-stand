# Lemonade Stand Simulator

## Project Overview

A browser-based business simulation game built with vanilla HTML, CSS, and JavaScript. Players run a lemonade stand over multiple days, making decisions about inventory, pricing, recipe ratios, and advertising to maximize profit.

## Architecture

The entire project lives in a single file: `index.html` (no build step, no dependencies).

**File layout:**
- Lines 1–185: HTML structure and embedded CSS
- Lines 188–240: Game constants and initial state (`G` object)
- Lines 242–564: Utility functions and game mechanics
- Lines 567–850: UI rendering functions
- Lines 1000–1106: Event handlers and game loop

**State management:** A single global object `G` holds all game state (money, inventory, reputation, day count, etc.). The entire UI re-renders on each state change via `render()`.

## Running the Game

No installation or build required. Just open the file in a browser:

```bash
open index.html
# or serve locally:
python -m http.server 8000
# then visit http://localhost:8000
```

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
- No external dependencies; runs in any modern browser (ES6+)
- Emojis are used extensively as UI icons — preserve them when editing UI strings
