import seasonsData from '@/data/seasons.json';

export interface SeasonDef {
  id: string;
  nameKo: string;
  startAt: string;
  endAt: string;
  themeColors: { primary: string; secondary: string };
  limitedCharacters: string[];
  limitedFurniture: string[];
  limitedQuizTrack?: string;
  rewards?: Record<string, Partial<Record<'snack' | 'starDust' | 'magicStone' | 'gachaTicket', number>>>;
}

const SEASONS: SeasonDef[] = seasonsData.seasons as unknown as SeasonDef[];

/**
 * Returns the season active at `nowMs`, or null if none.
 * Seasons are sorted by startAt ascending; ties resolve in declaration order.
 */
export function activeSeason(nowMs: number): SeasonDef | null {
  return (
    SEASONS.find((s) => {
      const start = Date.parse(s.startAt);
      const end = Date.parse(s.endAt);
      return nowMs >= start && nowMs <= end;
    }) ?? null
  );
}

export function allSeasons(): readonly SeasonDef[] {
  return SEASONS;
}

/**
 * True if a season-locked character/furniture id is currently obtainable.
 * The Dex UI uses this to render a 기간 한정 badge for items that aren't
 * permanent.
 */
export function isLimitedAvailable(itemId: string, nowMs: number = Date.now()): boolean {
  const s = activeSeason(nowMs);
  if (!s) return false;
  return s.limitedCharacters.includes(itemId) || s.limitedFurniture.includes(itemId);
}
