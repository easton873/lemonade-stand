import { describe, it, expect, beforeEach } from 'vitest';
import {
  PRICES, BULK_BREAKS, REP_START, CUPS_PER_PITCHER,
  G, resetState,
  supplyPrice, maxQtyAffordable, bulkLabel,
  repLabel, repMult, brandBoost, brandElasReduct,
  invTotal, maxCups, buyItem, expireInv,
  getAdTiers, recipeQuality,
  sumEmoji, sumTitle,
} from './game.js';

beforeEach(() => {
  resetState();
});

// ── supplyPrice ───────────────────────────────────────────────
describe('supplyPrice', () => {
  it('returns base price for small quantities', () => {
    expect(supplyPrice('lemon', 1)).toBe(PRICES.lemon);
    expect(supplyPrice('sugar', 50)).toBe(PRICES.sugar);
    expect(supplyPrice('ice', 99)).toBe(PRICES.ice);
  });

  it('applies 10% discount at 100 units', () => {
    expect(supplyPrice('lemon', 100)).toBeCloseTo(PRICES.lemon * 0.90, 5);
    expect(supplyPrice('sugar', 100)).toBeCloseTo(PRICES.sugar * 0.90, 5);
  });

  it('applies 20% discount at 500 units', () => {
    expect(supplyPrice('lemon', 500)).toBeCloseTo(PRICES.lemon * 0.80, 5);
  });

  it('applies 35% discount at 1000 units', () => {
    expect(supplyPrice('lemon', 1000)).toBeCloseTo(PRICES.lemon * 0.65, 5);
  });

  it('applies 50% discount at 5000 units', () => {
    expect(supplyPrice('lemon', 5000)).toBeCloseTo(PRICES.lemon * 0.50, 5);
    expect(supplyPrice('lemon', 9999)).toBeCloseTo(PRICES.lemon * 0.50, 5);
  });

  it('uses the highest applicable discount tier', () => {
    // 1500 units should use 1000-tier (35%), not 500-tier (20%)
    expect(supplyPrice('lemon', 1500)).toBeCloseTo(PRICES.lemon * 0.65, 5);
  });
});

// ── maxQtyAffordable ──────────────────────────────────────────
describe('maxQtyAffordable', () => {
  it('returns 0 for zero or negative budget', () => {
    expect(maxQtyAffordable('lemon', 0)).toBe(0);
    expect(maxQtyAffordable('lemon', -5)).toBe(0);
  });

  it('returns floor of budget / base price for small quantities', () => {
    // $1 buys 2 lemons at $0.50 each
    expect(maxQtyAffordable('lemon', 1.00)).toBe(2);
    // $0.25 buys 1 sugar at $0.20 each
    expect(maxQtyAffordable('sugar', 0.25)).toBe(1);
  });

  it('uses bulk pricing when budget qualifies for a discount tier', () => {
    // At 100+ lemons: $0.45 each (10% off). $50 / $0.45 = 111 lemons
    const qty = maxQtyAffordable('lemon', 50);
    expect(qty).toBeGreaterThanOrEqual(100);
    // Verify the result is correct by checking affordability
    const price = supplyPrice('lemon', qty);
    expect(price * qty).toBeLessThanOrEqual(50 + 0.001);
  });

  it('handles exact breakpoint budgets', () => {
    // Enough for exactly 100 lemons at 10% off: 100 * 0.45 = $45
    const qty = maxQtyAffordable('lemon', 45);
    expect(qty).toBeGreaterThanOrEqual(100);
  });
});

// ── bulkLabel ─────────────────────────────────────────────────
describe('bulkLabel', () => {
  it('shows next threshold when no discount applies', () => {
    const label = bulkLabel(0);
    expect(label.pct).toBe(0);
    expect(label.next).not.toBeNull();
  });

  it('shows 10% at 100 units', () => {
    expect(bulkLabel(100).pct).toBe(10);
    expect(bulkLabel(100).next).toBeNull();
  });

  it('shows 20% at 500 units', () => {
    expect(bulkLabel(500).pct).toBe(20);
    expect(bulkLabel(500).next).toBeNull();
  });

  it('shows 35% at 1000 units', () => {
    expect(bulkLabel(1000).pct).toBe(35);
  });

  it('shows 50% at 5000 units', () => {
    expect(bulkLabel(5000).pct).toBe(50);
    expect(bulkLabel(9999).pct).toBe(50);
  });
});

// ── repMult ───────────────────────────────────────────────────
describe('repMult', () => {
  it('returns 1.0 at starting reputation', () => {
    expect(repMult(REP_START)).toBeCloseTo(1.0);
  });

  it('returns 2.0 at 4x starting reputation', () => {
    expect(repMult(REP_START * 4)).toBeCloseTo(2.0);
  });

  it('returns 0.5 at quarter starting reputation', () => {
    expect(repMult(REP_START / 4)).toBeCloseTo(0.5);
  });

  it('increases monotonically with reputation', () => {
    expect(repMult(100)).toBeGreaterThan(repMult(50));
    expect(repMult(200)).toBeGreaterThan(repMult(100));
  });
});

// ── brandBoost ────────────────────────────────────────────────
describe('brandBoost', () => {
  it('returns 0 or negative below rep 100 (clamped to 0 by callers)', () => {
    expect(brandBoost(50)).toBeLessThanOrEqual(0);
    expect(brandBoost(99)).toBeLessThanOrEqual(0);
  });

  it('returns 0 at exactly rep 100', () => {
    expect(brandBoost(100)).toBeCloseTo(0);
  });

  it('returns positive boost above rep 100', () => {
    expect(brandBoost(200)).toBeGreaterThan(0);
    expect(brandBoost(600)).toBeGreaterThan(0);
  });

  it('caps at 1.5 (beyond rep 850)', () => {
    expect(brandBoost(850)).toBeCloseTo(1.5);
    expect(brandBoost(9999)).toBeCloseTo(1.5);
  });
});

// ── brandElasReduct ───────────────────────────────────────────
describe('brandElasReduct', () => {
  it('returns 0 at rep 100', () => {
    expect(brandElasReduct(100)).toBeCloseTo(0);
  });

  it('caps at 0.80', () => {
    expect(brandElasReduct(9999)).toBeCloseTo(0.80);
  });

  it('increases with reputation above 100', () => {
    expect(brandElasReduct(300)).toBeGreaterThan(brandElasReduct(200));
  });
});

// ── repLabel ──────────────────────────────────────────────────
describe('repLabel', () => {
  const cases = [
    [500, 'Legendary'],
    [300, 'Beloved'],
    [200, 'Famous'],
    [150, 'Popular'],
    [100, 'Well-Known'],
    [75,  'Growing'],
    [50,  'Unknown'],
    [30,  'Mixed'],
    [15,  'Poor'],
    [1,   'Terrible'],
  ];

  it.each(cases)('rep %i → %s', (rep, label) => {
    expect(repLabel(rep)).toBe(label);
  });
});

// ── invTotal ──────────────────────────────────────────────────
describe('invTotal', () => {
  it('returns 0 for empty inventory', () => {
    expect(invTotal('lemon')).toBe(0);
    expect(invTotal('sugar')).toBe(0);
    expect(invTotal('ice')).toBe(0);
  });

  it('sums a single batch', () => {
    G.inv.lemon = [{ qty: 10, exp: 8 }];
    expect(invTotal('lemon')).toBe(10);
  });

  it('sums multiple batches', () => {
    G.inv.lemon = [{ qty: 10, exp: 8 }, { qty: 5, exp: 9 }];
    expect(invTotal('lemon')).toBe(15);
  });
});

// ── maxCups ───────────────────────────────────────────────────
describe('maxCups', () => {
  beforeEach(() => {
    G.recipe = { lemons: 2, sugar: 2 }; // 4 ingredients per pitcher = 1 per cup
    G.inv.lemon = [{ qty: 8, exp: 8 }];
    G.inv.sugar = [{ qty: 8, exp: 8 }];
    G.inv.ice   = [{ qty: 6, exp: 2 }];
  });

  it('is limited by ice when withIce=true', () => {
    // 8 lemons → 16 cups, 8 sugar → 16 cups, 6 ice → 6 cups
    expect(maxCups(true)).toBe(6);
  });

  it('ignores ice when withIce=false', () => {
    // limited by lemons/sugar only: 8 / (2/4) = 16
    expect(maxCups(false)).toBe(16);
  });

  it('is limited by the most constrained ingredient', () => {
    G.inv.lemon = [{ qty: 4, exp: 8 }]; // 4 / 0.5 = 8 cups
    G.inv.sugar = [{ qty: 12, exp: 8 }]; // 12 / 0.5 = 24 cups
    expect(maxCups(false)).toBe(8);
  });
});

// ── buyItem / expireInv ───────────────────────────────────────
describe('buyItem', () => {
  it('deducts money and adds to inventory', () => {
    G.money = 20;
    buyItem('lemon', 10);
    expect(G.inv.lemon[0].qty).toBe(10);
    expect(G.money).toBeCloseTo(20 - 10 * PRICES.lemon, 2);
  });

  it('applies bulk discount on large purchases', () => {
    G.money = 500;
    buyItem('lemon', 1000);
    const spent = 500 - G.money;
    const expected = 1000 * PRICES.lemon * 0.65;
    expect(spent).toBeCloseTo(expected, 1);
  });

  it('merges batches with the same expiry day', () => {
    G.money = 100;
    buyItem('lemon', 5);
    buyItem('lemon', 3);
    expect(G.inv.lemon).toHaveLength(1);
    expect(G.inv.lemon[0].qty).toBe(8);
  });
});

describe('expireInv', () => {
  it('removes batches that have expired', () => {
    G.day = 5;
    G.inv.lemon = [{ qty: 10, exp: 5 }]; // expires on day 5 — filter is exp > day
    expireInv();
    expect(invTotal('lemon')).toBe(0);
  });

  it('keeps batches that have not yet expired', () => {
    G.day = 5;
    G.inv.lemon = [{ qty: 10, exp: 6 }];
    expireInv();
    expect(invTotal('lemon')).toBe(10);
  });

  it('handles mixed batches', () => {
    G.day = 5;
    G.inv.lemon = [{ qty: 10, exp: 5 }, { qty: 7, exp: 10 }];
    expireInv();
    expect(invTotal('lemon')).toBe(7);
  });
});

// ── getAdTiers ────────────────────────────────────────────────
describe('getAdTiers', () => {
  it('returns baseline when no ads selected', () => {
    G.adTiers = [];
    const result = getAdTiers();
    expect(result.cost).toBe(0);
    expect(result.mult).toBe(1);
    expect(result.repBonus).toBe(0);
  });

  it('aggregates cost, reach, and rep bonus for a single ad', () => {
    G.adTiers = ['sign'];
    const result = getAdTiers();
    expect(result.cost).toBe(1);
    expect(result.mult).toBeCloseTo(1.20);
    expect(result.repBonus).toBe(0.5);
  });

  it('combines multiple ads with additive reach bonuses', () => {
    G.adTiers = ['sign', 'flyers']; // sign: +20%, flyers: +45%
    const result = getAdTiers();
    expect(result.cost).toBe(1 + 3);
    // mult = 1 + (1.20-1) + (1.45-1) = 1 + 0.20 + 0.45 = 1.65
    expect(result.mult).toBeCloseTo(1.65);
  });
});

// ── recipeQuality ─────────────────────────────────────────────
describe('recipeQuality', () => {
  it('returns terrible for zero-ingredient recipe', () => {
    G.recipe = { lemons: 0, sugar: 0 };
    expect(recipeQuality().tier).toBe('terrible');
  });

  it('returns perfect for balanced, well-proportioned recipe', () => {
    // lemons=2, sugar=2: tartness=0.5 (tScore=4), richness=4/4=1.0 (rScore=4)
    G.recipe = { lemons: 2, sugar: 2 };
    const q = recipeQuality();
    expect(q.tier).toBe('perfect');
    expect(q.tScore).toBe(4);
    expect(q.rScore).toBe(4);
  });

  it('returns terrible for overly sweet recipe', () => {
    // lemons=1, sugar=8: tartness=1/9≈0.11 < 0.15 → tScore=0
    G.recipe = { lemons: 1, sugar: 8 };
    expect(recipeQuality().tier).toBe('terrible');
  });

  it('returns terrible for overly sour recipe', () => {
    // lemons=8, sugar=1: tartness=8/9≈0.89 > 0.85 → tScore=0
    G.recipe = { lemons: 8, sugar: 1 };
    expect(recipeQuality().tier).toBe('terrible');
  });

  it('returns bad for too-sweet recipe', () => {
    // lemons=1, sugar=4: tartness=0.2 → tScore=1 (bad); richness=5/4=1.25 → rScore=4
    G.recipe = { lemons: 1, sugar: 4 };
    expect(recipeQuality().tier).toBe('bad');
  });

  it('returns bad for overpowering recipe', () => {
    // lemons=6, sugar=6: richness=12/4=3 > 2.5 → rScore=1 (bad)
    G.recipe = { lemons: 6, sugar: 6 };
    expect(recipeQuality().tier).toBe('bad');
  });

  it('has higher qualMult for better recipes', () => {
    G.recipe = { lemons: 2, sugar: 2 }; // perfect
    const perfect = recipeQuality().qualMult;

    G.recipe = { lemons: 1, sugar: 8 }; // terrible
    const terrible = recipeQuality().qualMult;

    expect(perfect).toBeGreaterThan(terrible);
  });

  it('gives positive repDelta for perfect recipe', () => {
    G.recipe = { lemons: 2, sugar: 2 };
    expect(recipeQuality().repDelta).toBeGreaterThan(0);
  });

  it('gives negative repDelta for terrible recipe', () => {
    G.recipe = { lemons: 1, sugar: 8 };
    expect(recipeQuality().repDelta).toBeLessThan(0);
  });
});

// ── sumEmoji / sumTitle ───────────────────────────────────────
describe('sumEmoji', () => {
  it('shows sad face when nothing sold', () => {
    expect(sumEmoji({ sold: 0, net: -5 })).toBe('😞');
  });

  it('shows money face for big profit', () => {
    expect(sumEmoji({ sold: 10, net: 10 })).toBe('🤑');
  });

  it('shows happy face for small profit', () => {
    expect(sumEmoji({ sold: 5, net: 2 })).toBe('😊');
  });
});

describe('sumTitle', () => {
  it('returns "Rough day..." when nothing sold', () => {
    expect(sumTitle({ sold: 0, want: 10, net: -5 })).toBe('Rough day...');
  });

  it('returns "Great day!" when all sold with good profit', () => {
    expect(sumTitle({ sold: 10, want: 10, net: 5 })).toBe('Great day!');
  });

  it('returns "Ran out early!" when less than 45% sold', () => {
    expect(sumTitle({ sold: 4, want: 10, net: 1 })).toBe('Ran out early!');
  });
});
