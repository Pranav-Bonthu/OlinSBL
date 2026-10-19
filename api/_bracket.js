// Bracket format (version 2), from the "bracket" tab of the league sheet.
//
// Week 1      6 games. Everyone gets one life.
// Week 2      Winners: W1 winners play (W2). Losers: W1 losers play (L2); losing here is your second loss.
// Week 3      Crossover (X3): each W2 loser plays an L2 winner from a different group.
// Weeks 3-4   Winners round robin (WRR) between the 3 W2 winners.
// Week 4      Losers round robin (LRR) between the 3 crossover winners.
// Week 5      QF-1: winners RR #1 vs #2. QF-2: winners RR #3 vs losers RR #1.
// Week 6      SF-1: loser of QF-1 vs winner of QF-2.
// Week 7      F-1: winner of QF-1 vs winner of SF-1.
// Week 8      F-2: only if the Week 6 team wins F-1 (they must beat the unbeaten side twice).
export const FORMAT = 2;

const g = (id, round, src, extra) => ({ id, round, src, target: 11, ...(extra || {}) });

export function template() {
  return [
    g('W2-1', 'W2', [['W', 'W1-1'], ['W', 'W1-2']]),
    g('W2-2', 'W2', [['W', 'W1-3'], ['W', 'W1-4']]),
    g('W2-3', 'W2', [['W', 'W1-5'], ['W', 'W1-6']]),
    g('L2-1', 'L2', [['L', 'W1-1'], ['L', 'W1-2']]),
    g('L2-2', 'L2', [['L', 'W1-3'], ['L', 'W1-4']]),
    g('L2-3', 'L2', [['L', 'W1-5'], ['L', 'W1-6']]),
    // Group n = W1 games 2n-1 and 2n. Crossovers never pair two teams from the same group.
    g('X3-1', 'X3', [['L', 'W2-1'], ['W', 'L2-2']]),
    g('X3-2', 'X3', [['L', 'W2-2'], ['W', 'L2-3']]),
    g('X3-3', 'X3', [['L', 'W2-3'], ['W', 'L2-1']]),
    g('WRR-1', 'WRR', [['W', 'W2-1'], ['W', 'W2-2']]),
    g('WRR-2', 'WRR', [['W', 'W2-1'], ['W', 'W2-3']]),
    g('WRR-3', 'WRR', [['W', 'W2-2'], ['W', 'W2-3']]),
    g('LRR-1', 'LRR', [['W', 'X3-1'], ['W', 'X3-2']]),
    g('LRR-2', 'LRR', [['W', 'X3-1'], ['W', 'X3-3']]),
    g('LRR-3', 'LRR', [['W', 'X3-2'], ['W', 'X3-3']]),
    g('QF-1', 'QF', [['RR', 'WRR', 1], ['RR', 'WRR', 2]]),
    g('QF-2', 'QF', [['RR', 'WRR', 3], ['RR', 'LRR', 1]]),
    g('SF-1', 'SF', [['L', 'QF-1'], ['W', 'QF-2']]),
    g('F-1', 'F', [['W', 'QF-1'], ['W', 'SF-1']]),
    g('F-2', 'F', [['W', 'F-1'], ['L', 'F-1']], { ifNeeded: 'F-1' }),
  ];
}

const hasData = x => x && (x.scoreA != null || x.scoreB != null || x.winner ||
  (x.stats && Object.keys(x.stats).length) || (x.videos && x.videos.length));

// Converts older league data to this format. Keeps every Week 1 game as is, and keeps
// results, stats and videos for any game whose id and round are unchanged.
// Returns null when the data is already in this format.
export function migrate(data) {
  if (!data || !Array.isArray(data.games) || data.format === FORMAT) return null;
  const old = new Map(data.games.map(x => [x.id, x]));
  const games = data.games.filter(x => x.round === 'W1');
  for (const t of template()) {
    const prev = old.get(t.id);
    games.push(prev && prev.round === t.round ? { ...prev, src: t.src, round: t.round } : t);
  }
  // Games from the old format that no longer exist; kept aside only if someone had entered data.
  const ids = new Set(games.map(x => x.id));
  const dropped = data.games.filter(x => !ids.has(x.id) && hasData(x));
  const out = { ...data, format: FORMAT, games };
  if (dropped.length) out.retiredGames = [...(data.retiredGames || []), ...dropped];
  // The league sheet records Big League Ballers winning Week 1 Game 2.
  const w12 = games.find(x => x.id === 'W1-2');
  if (w12 && !hasData(w12) && w12.teamB === 'blb') w12.winner = 'blb';
  return out;
}
