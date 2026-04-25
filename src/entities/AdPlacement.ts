export type AdPlacementId =
  | 'fatigue_restore'
  | 'quiz_extra_session'
  | 'merge_boost'
  | 'block_continue'
  | 'gacha_ticket_chance';

export interface AdPlacementDef {
  id: AdPlacementId;
  /** Maximum watches per day. */
  dailyCap: number;
  /** Activated from which roadmap stage onwards. */
  activatedFrom: 'alpha' | 'beta';
  /** Free-form description used for the rewards UI / tests. */
  rewardLabel: string;
}
