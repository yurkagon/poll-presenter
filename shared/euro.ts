// EURO scoring: jury and audience weigh equally (50/50). Each is placed on a
// 0..12 scale, so the combined maximum is 24.
//
// - Jury: the host enters a mark 0..12 per team directly.
// - Audience: viewers rank 3 teams (🥇🥈🥉 = 3/2/1). A team's raw medal total is
//   normalized against the THEORETICAL maximum (every voter giving it 🥇 = 3),
//   so 12 means "everyone's favourite" and anything less is proportional.

export const MAX_JURY = 12;
export const MAX_AUDIENCE = 12;
export const MAX_EURO = MAX_JURY + MAX_AUDIENCE; // 24
const TOP_MEDAL_POINTS = 3; // 🥇

/** Raw audience medal total → 0..12 (vs everyone giving this team 🥇). */
export function audienceScore(rawMedalPoints: number, voters: number): number {
  if (voters <= 0) return 0;
  const maxPossible = TOP_MEDAL_POINTS * voters;
  return Math.min(MAX_AUDIENCE, (MAX_AUDIENCE * (rawMedalPoints ?? 0)) / maxPossible);
}

/** Combined 0..24 = jury (0..12) + audience (0..12). */
export function euroCombined(
  juryScore: number,
  rawMedalPoints: number,
  voters: number,
): number {
  return (juryScore ?? 0) + audienceScore(rawMedalPoints, voters);
}

/** Round to one decimal for display (e.g. 11.5), dropping a trailing ".0". */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
