// ── CONSTANTS ─────────────────────────────────────────────────
export const PRICES = { lemon:.50, sugar:.20, ice:.05 };
export const EXPIRY  = { lemon:7,   sugar:90,  ice:1  };
export const CUPS_PER_PITCHER = 4;
export const START_MONEY = 20;
export const REP_START   = 50;

export const WEATHERS = [
  {id:'scorching', name:'Scorching',   icon:'🌡️', temp:'98°F', demand:2.2, iceWant:2.0, desc:'Blazing hot — everyone wants lemonade!'},
  {id:'hot',       name:'Hot & Sunny', icon:'☀️',  temp:'86°F', demand:1.6, iceWant:1.5, desc:'Great lemonade weather'},
  {id:'warm',      name:'Warm',        icon:'🌤️', temp:'74°F', demand:1.0, iceWant:1.0, desc:'Comfortable day'},
  {id:'overcast',  name:'Overcast',    icon:'☁️',  temp:'66°F', demand:0.7, iceWant:0.7, desc:'Grey but decent turnout'},
  {id:'cool',      name:'Cool',        icon:'⛅',  temp:'60°F', demand:0.5, iceWant:0.45,desc:'A bit chilly today'},
  {id:'rainy',     name:'Rainy',       icon:'🌧️', temp:'57°F', demand:0.3, iceWant:0.25,desc:'Rain keeps people inside'},
  {id:'cold',      name:'Cold',        icon:'🧣',  temp:'44°F', demand:0.18,iceWant:0.08,desc:'Too cold for most'},
  {id:'stormy',    name:'Stormy',      icon:'⛈️', temp:'51°F', demand:0.05,iceWant:0.05,desc:'Stay inside — barely anyone out!'},
];
export const WX_WEIGHTS = [5,25,28,15,12,8,5,2];

export const LOCS = {
  city:    {id:'city',    name:'City',    icon:'🏙️', base:40, elas:0.7,  desc:'Busy streets, lots of foot traffic. Customers aren\'t very price‑sensitive.',    traits:['High foot traffic','Less price‑sensitive','Consistent demand']},
  country: {id:'country', name:'Country', icon:'🌾', base:18, elas:1.45, desc:'Quiet roads and regulars. Customers know value and expect fair prices.', traits:['Lower traffic','Very price‑sensitive','Weather‑dependent']},
};

export const AD_TIERS = [
  {id:'none',       name:'No advertising',          icon:'—',   cost:0,         mult:1.0,    repBonus:0,    desc:'Just open the stand and hope for the best'},
  {id:'sign',       name:'Friend with a sign',       icon:'🪧',  cost:1,         mult:1.20,   repBonus:0.5,  desc:'Your buddy waves people over from the sidewalk'},
  {id:'flyers',     name:'Handmade flyers',           icon:'📄',  cost:3,         mult:1.45,   repBonus:1,    desc:'Stapled to every telephone pole in the neighborhood'},
  {id:'newspaper',  name:'Newspaper ad',              icon:'📰',  cost:5,         mult:1.70,   repBonus:1.5,  desc:'Quarter-page ad in the local gazette'},
  {id:'social',     name:'Social media post',         icon:'📱',  cost:15,        mult:2.20,   repBonus:3,    desc:'Boosted post hitting local feeds all morning'},
  {id:'radio',      name:'Local radio spot',          icon:'📻',  cost:40,        mult:3.20,   repBonus:6,    desc:'30-second spot on morning drive-time radio'},
  {id:'banner',     name:'Online banner ads',         icon:'💻',  cost:100,       mult:5.00,   repBonus:12,   desc:'Targeted display ads all over the web'},
  {id:'billboard',  name:'Billboard',                 icon:'🪟',  cost:1000,      mult:12.0,   repBonus:25,   desc:'Your stand on a massive roadside billboard'},
  {id:'tv',         name:'Local TV commercial',       icon:'📺',  cost:5000,      mult:40.0,   repBonus:70,   desc:'30-second spot on the evening local news'},
  {id:'influencer', name:'Influencer deal',           icon:'⭐',  cost:25000,     mult:150.0,  repBonus:200,  desc:'A famous foodie visits and posts to 2M followers'},
  {id:'national',   name:'National TV ad',            icon:'🎬',  cost:100000,    mult:500.0,  repBonus:600,  desc:'Prime-time commercial, coast to coast'},
  {id:'superbowl',  name:'Super Bowl commercial',     icon:'🏈',  cost:1000000,   mult:2000.0, repBonus:2000, desc:'100 million viewers. The ultimate flex.'},
];

// Supply bulk discount tiers: [minQty, discountFraction]
export const BULK_BREAKS = [[5000,.50],[1000,.35],[500,.20],[100,.10]];

// ── STATE ─────────────────────────────────────────────────────
export let G = {
  screen:'setup', money:START_MONEY, day:1, loc:null,
  inv:{ lemon:[], sugar:[], ice:[] }, // [{qty,exp}]
  price:1.00, rep:REP_START,
  recipe:{ lemons:2, sugar:3 }, // per pitcher (CUPS_PER_PITCHER cups)
  weather:null, nextWeather:null, forecastWeather:null,
  spend:0, pending:{lemon:0,sugar:0,ice:0}, adTiers:[],
  result:null, history:[]
};

export function resetState(){
  G.screen='setup'; G.money=START_MONEY; G.day=1; G.loc=null;
  G.inv={lemon:[],sugar:[],ice:[]};
  G.price=1.00; G.rep=REP_START;
  G.recipe={lemons:2,sugar:3};
  G.weather=null; G.nextWeather=null; G.forecastWeather=null;
  G.spend=0; G.pending={lemon:0,sugar:0,ice:0}; G.adTiers=[];
  G.result=null; G.history=[];
}

// ── UTILS ─────────────────────────────────────────────────────
export function supplyPrice(t, qty){
  const base = PRICES[t];
  for(const [min,disc] of BULK_BREAKS) if(qty>=min) return Math.round(base*(1-disc)*1000)/1000;
  return base;
}

// Max qty of type t affordable within budget (respects tier pricing)
export function maxQtyAffordable(t, budget){
  if(budget<=0) return 0;
  for(const [min,disc] of BULK_BREAKS){
    const price = PRICES[t]*(1-disc);
    const q = Math.floor(budget/price);
    if(q>=min) return q;
  }
  return Math.floor(budget/PRICES[t]);
}

export function bulkLabel(qty){
  for(const [min,disc] of BULK_BREAKS)
    if(qty>=min) return {pct:Math.round(disc*100), next:null};
  const next = BULK_BREAKS[BULK_BREAKS.length-1];
  return {pct:0, next:{min:next[0], pct:Math.round(next[1]*100)}};
}
export const fmt = n  => '$'+Math.abs(n).toFixed(2);
export const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
export const rng = (lo,hi) => lo + Math.random()*(hi-lo);

export function invTotal(t){ return G.inv[t].reduce((s,b)=>s+b.qty,0); }

export function maxCups(withIce){
  const lpc = G.recipe.lemons / CUPS_PER_PITCHER;
  const spc = G.recipe.sugar  / CUPS_PER_PITCHER;
  const fromLemon = lpc > 0 ? Math.floor(invTotal('lemon') / lpc) : Infinity;
  const fromSugar = spc > 0 ? Math.floor(invTotal('sugar') / spc) : Infinity;
  return withIce ? Math.min(fromLemon, fromSugar, invTotal('ice'))
                 : Math.min(fromLemon, fromSugar);
}

export function expireInv(){
  for(const t of ['lemon','sugar','ice'])
    G.inv[t] = G.inv[t].filter(b=>b.exp > G.day);
}

export function useIngredients(cups, iceQty){
  // cups = total sold; iceQty = how many of those used ice
  const lemonsNeeded = Math.min(Math.round(cups * G.recipe.lemons / CUPS_PER_PITCHER), invTotal('lemon'));
  const sugarNeeded  = Math.min(Math.round(cups * G.recipe.sugar  / CUPS_PER_PITCHER), invTotal('sugar'));
  for(const [t, need0] of [['lemon', lemonsNeeded], ['sugar', sugarNeeded]]){
    let need = need0;
    for(const b of G.inv[t]){
      const use = Math.min(b.qty, need);
      b.qty -= use; need -= use;
      if(need===0) break;
    }
    G.inv[t] = G.inv[t].filter(b=>b.qty>0);
  }
  if(iceQty>0){
    let need = iceQty;
    for(const b of G.inv.ice){
      const use = Math.min(b.qty, need);
      b.qty -= use; need -= use;
      if(need===0) break;
    }
    G.inv.ice = G.inv.ice.filter(b=>b.qty>0);
  }
}

export function buyItem(type, qty){
  if(qty<=0) return;
  const cost = Math.round(supplyPrice(type,qty)*qty*100)/100;
  G.money -= cost; G.money = Math.round(G.money*100)/100;
  G.spend += cost;
  const exp = G.day + EXPIRY[type];
  const ex = G.inv[type].find(b=>b.exp===exp);
  if(ex) ex.qty+=qty; else G.inv[type].push({qty,exp});
}

// ── WEATHER ──────────────────────────────────────────────────
export function pickWeather(){
  const total = WX_WEIGHTS.reduce((a,b)=>a+b,0);
  let r = Math.random()*total;
  for(let i=0;i<WEATHERS.length;i++){ r-=WX_WEIGHTS[i]; if(r<=0) return WEATHERS[i]; }
  return WEATHERS[2];
}

export function makeForecast(actual){
  if(Math.random()<0.70) return actual;
  const idx = WEATHERS.indexOf(actual);
  const shift = Math.random()<0.5 ? -1 : 1;
  return WEATHERS[clamp(idx+shift,0,WEATHERS.length-1)];
}

// ── SIMULATION ───────────────────────────────────────────────
export function simulateDay(){
  const loc = LOCS[G.loc], wx = G.weather;

  const iceAvail = invTotal('ice');
  const lemAvail = invTotal('lemon');
  const sugAvail = invTotal('sugar');

  // Potential customers — scaled by reputation and recipe quality
  const tier = getAdTiers();
  const rq   = recipeQuality();
  let pot = loc.base * wx.demand * tier.mult * repMult(G.rep) * rq.qualMult * rng(0.8,1.2);
  pot = Math.round(pot);

  // Price effect — brand recognition raises sweet spot & softens elasticity at high rep
  const bBoost = Math.max(0, brandBoost(G.rep));
  const bElas  = Math.max(0, brandElasReduct(G.rep));
  const sweet  = 0.70 + wx.demand*0.25 + bBoost;
  const effElas = loc.elas * (1 - bElas);
  const priceMult = clamp(1 - (G.price - sweet)*effElas*0.55, 0.05, 1.0);
  const fullWant = Math.round(pot * priceMult);

  // Phase 1: sell with ice until ice runs out
  const soldWithIce = Math.min(fullWant, iceAvail, lemAvail, sugAvail);

  // Phase 2: remaining customers may still buy without ice (with hot-day penalty)
  const remainingWant = fullWant - soldWithIce;
  let noIceMult = 1;
  if(wx.iceWant>=1.5) noIceMult=0.55;
  else if(wx.iceWant>=1.0) noIceMult=0.78;
  const wantNoIce = Math.round(remainingWant * noIceMult);
  const soldNoIce = Math.min(wantNoIce, lemAvail - soldWithIce, sugAvail - soldWithIce);

  const sold = soldWithIce + soldNoIce;
  const rev  = Math.round(sold*G.price*100)/100;
  const net  = Math.round((rev-G.spend)*100)/100;
  const hasIce = iceAvail>0;

  useIngredients(sold, soldWithIce);
  G.money = Math.round((G.money+rev)*100)/100;

  // ── REPUTATION DELTA ─────────────────────────────────────────
  let repDelta = tier.repBonus; // advertising builds brand every day

  // Recipe quality: good lemonade earns word-of-mouth; bad drives customers away
  repDelta += rq.repDelta;

  // Price reputation: fair pricing builds trust; gouging destroys it
  const priceDiff = G.price - sweet;
  if(priceDiff < -0.15)      repDelta += 0.3;  // great deal
  else if(priceDiff <= 0.10) repDelta += 0.5;  // fair
  else if(priceDiff <= 0.30) repDelta -= 0.5;  // pricey
  else                        repDelta -= 2.0;  // gouging

  // Supply reliability: serving everyone earns trust; running out loses it
  if(sold >= fullWant){
    repDelta += 1.5; // never ran out — customers can rely on you
  } else {
    const ratio = (fullWant - sold) / fullWant;
    repDelta -= Math.min(ratio * 8, 8); // up to -8 for turning everyone away
  }

  const repBefore = G.rep;
  G.rep = Math.max(1, Math.round((G.rep + repDelta) * 10) / 10);

  let reaction = '';
  if(sold===0) reaction='Not a single cup sold today.';
  else if(sold>=fullWant) reaction = G.price<sweet-0.25 ? 'Customers loved your prices!' : 'Served every customer who came by.';
  else if(sold<fullWant*0.5) reaction='Ran out of supplies early — customers left empty-handed!';
  else reaction='Ran out near the end of the day.';

  const r = {pot,want:fullWant,sold,rev,exp:Math.round(G.spend*100)/100,net,wx,hasIce,sweet,reaction,adTiers:tier,
             repBefore,repAfter:G.rep,repDelta:Math.round(repDelta*10)/10,recipe:rq};
  G.history.push(r);
  return r;
}

// ── REPUTATION HELPERS ────────────────────────────────────────
export function repLabel(rep){
  if(rep>=500)  return 'Legendary';
  if(rep>=300)  return 'Beloved';
  if(rep>=200)  return 'Famous';
  if(rep>=150)  return 'Popular';
  if(rep>=100)  return 'Well-Known';
  if(rep>=75)   return 'Growing';
  if(rep>=50)   return 'Unknown';
  if(rep>=30)   return 'Mixed';
  if(rep>=15)   return 'Poor';
  return 'Terrible';
}
export function repColor(rep){
  if(rep>=300) return '#f0c040';
  if(rep>=150) return '#7ed856';
  if(rep>=75)  return '#60c0ff';
  if(rep>=50)  return '#aaa';
  return '#e05050';
}
// Customer multiplier from reputation (square-root curve, starts at 1.0)
export function repMult(rep){ return Math.sqrt(rep/REP_START); }
// Brand recognition: at high rep, sweet-spot price rises and elasticity eases
export function brandBoost(rep){
  return Math.min((rep-100)/500, 1.5);  // kicks in above rep 100, caps at +$1.50
}
export function brandElasReduct(rep){
  return Math.min((rep-100)/400, 0.80); // up to 80% less price-sensitive
}

// ── RECIPE QUALITY ────────────────────────────────────────────
export function recipeQuality(){
  const {lemons: L, sugar: S} = G.recipe;
  const total = L + S;
  if(total === 0) return {tier:'terrible', repDelta:-3, qualMult:0.70, label:'No recipe 🤢', color:'#e05050', feedback:'"There\'s nothing in this lemonade!"'};

  const tartness = L / total;               // 0=all sugar → 1=all lemon
  const richness = total / CUPS_PER_PITCHER; // ingredients per cup

  // Taste score (tartness) — ideal 0.45–0.60
  let tScore;
  if     (tartness < 0.15 || tartness > 0.85) tScore = 0; // terrible
  else if(tartness < 0.25 || tartness > 0.75) tScore = 1; // bad
  else if(tartness < 0.35 || tartness > 0.65) tScore = 2; // ok
  else if(tartness < 0.45 || tartness > 0.60) tScore = 3; // good
  else                                          tScore = 4; // perfect

  // Richness score — ideal 0.875–1.875 ingredients/cup
  let rScore;
  if     (richness < 0.25)                rScore = 0; // terrible: barely anything
  else if(richness < 0.5)                 rScore = 1; // bad: watery
  else if(richness < 0.875)               rScore = 2; // ok
  else if(richness <= 1.875)              rScore = 4; // perfect zone
  else if(richness <= 2.5)                rScore = 3; // good: strong but ok
  else                                    rScore = 1; // bad: overpowering

  const score = Math.min(tScore, rScore);

  let tier, repDelta, qualMult, label, color;
  if     (score === 0) { tier='terrible'; repDelta=-3;   qualMult=0.70; label='Terrible 🤢'; color='#e05050'; }
  else if(score === 1) { tier='bad';      repDelta=-1.5; qualMult=0.85; label='Bad 😕';      color='#e07030'; }
  else if(score === 2) { tier='ok';       repDelta=0;    qualMult=1.00; label='OK 👍';        color='#aaa';    }
  else if(score === 3) { tier='good';     repDelta=1;    qualMult=1.10; label='Good 😊';      color='#60c0ff'; }
  else                 { tier='perfect';  repDelta=2.5;  qualMult=1.25; label='Perfect! ⭐';  color='#f0c040'; }

  // Customer feedback message
  let feedback;
  if(tScore === 0 && tartness < 0.15)      feedback = '"Way too sweet — tastes like liquid candy!"';
  else if(tScore === 0)                    feedback = '"So sour it\'s painful! My face is puckering."';
  else if(tScore === 1 && tartness < 0.25) feedback = '"A bit too sweet for me."';
  else if(tScore === 1)                    feedback = '"A bit too sour — needs more sugar."';
  else if(rScore === 0)                    feedback = '"This is basically just water..."';
  else if(rScore === 1)                    feedback = '"Kind of watery — try a stronger mix."';
  else if(richness > 2.5)                  feedback = '"Way too strong and syrupy!"';
  else if(tier === 'perfect')              feedback = '"Best lemonade I\'ve had all summer!" ⭐';
  else if(tier === 'good')                 feedback = '"Really tasty lemonade!" 😊';
  else if(tScore === 3 && tartness < 0.45) feedback = '"Pretty good, maybe a touch more lemon?"';
  else if(tScore === 3)                    feedback = '"Pretty good, maybe a touch less lemon?"';
  else                                     feedback = '"Decent, but I\'ve had better."';

  return {tier, repDelta, qualMult, label, color, feedback, tartness, richness, tScore, rScore};
}

// ── HELPERS ──────────────────────────────────────────────────
export function demandBadge(d){
  if(d>=1.8) return '<span class="demand-badge d-vhigh">🔥 Very High</span>';
  if(d>=1.2) return '<span class="demand-badge d-high">📈 High</span>';
  if(d>=0.7) return '<span class="demand-badge d-med">➡️ Normal</span>';
  if(d>=0.35)return '<span class="demand-badge d-low">📉 Low</span>';
  return '<span class="demand-badge d-vlow">❄️ Very Low</span>';
}

export function priceHint(price, wx){
  const sweet = 0.70+wx.demand*0.25;
  if(price<sweet-0.3)  return '<span class="pos">Very affordable — expect a rush!</span>';
  if(price<sweet-0.1)  return '<span class="pos">Good price for today\'s weather</span>';
  if(price<=sweet+0.1) return '<span style="color:var(--o)">Fair price</span>';
  if(price<=sweet+0.3) return '<span class="neg">A bit pricey today</span>';
  return '<span class="neg">Too expensive — many will walk away</span>';
}

export function fxQuote(wx){
  const qs={scorching:'Bring extra ice — scorcher incoming!',hot:'Perfect lemonade weather!',
    warm:'Comfortable day, decent turnout.',overcast:'Grey skies, but lemonade always helps.',
    cool:'A bit chilly — stock lightly.',rainy:'Rain forecast. Consider skipping or stocking light.',
    cold:'Bundle up. Don\'t expect many buyers.',stormy:'Major storm. Almost nobody will be out.'};
  return qs[wx.id]||'';
}

export function sumEmoji(r){
  if(r.sold===0) return '😞';
  if(r.net>6) return '🤑'; if(r.net>0) return '😊';
  if(r.net>-3) return '😐'; return '😟';
}
export function sumTitle(r){
  if(r.sold===0) return 'Rough day...';
  if(r.sold>=r.want && r.net>3) return 'Great day!';
  if(r.sold>=r.want) return 'Solid day!';
  if(r.sold<r.want*0.45) return 'Ran out early!';
  return 'Not bad!';
}

export function pendingCost(){
  return ['lemon','sugar','ice'].reduce((s,t)=>s+supplyPrice(t,G.pending[t])*G.pending[t],0)+getAdTiers().cost;
}

export function getAdTiers(){
  const selected = G.adTiers.map(id=>AD_TIERS.find(t=>t.id===id)).filter(Boolean);
  const cost     = selected.reduce((s,t)=>s+t.cost, 0);
  const mult     = 1 + selected.reduce((s,t)=>s+(t.mult-1), 0); // additive reach bonuses
  const repBonus = selected.reduce((s,t)=>s+t.repBonus, 0);
  return {cost, mult, repBonus, tiers: selected};
}

export function cupsAfterBuy(){
  const lpc = G.recipe.lemons / CUPS_PER_PITCHER;
  const spc = G.recipe.sugar  / CUPS_PER_PITCHER;
  return Math.min(
    Math.floor((invTotal('lemon')+G.pending.lemon) / lpc),
    Math.floor((invTotal('sugar')+G.pending.sugar) / spc),
    invTotal('ice')+G.pending.ice
  );
}
export function cupsAfterBuyNoIce(){
  const lpc = G.recipe.lemons / CUPS_PER_PITCHER;
  const spc = G.recipe.sugar  / CUPS_PER_PITCHER;
  return Math.min(
    Math.floor((invTotal('lemon')+G.pending.lemon) / lpc),
    Math.floor((invTotal('sugar')+G.pending.sugar) / spc)
  );
}
