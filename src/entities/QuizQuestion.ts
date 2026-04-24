export type QuizCategory =
  | 'cat_care'
  | 'dog_care'
  | 'small_animal'
  | 'bird'
  | 'general';

/**
 * Production questions should store only i18n keys (textKey, optionKeys,
 * explanationKey) and resolve at render time. For PART 7 the JSON inlines
 * Korean text as a placeholder. Before soft launch, convert to i18n.
 */
export interface QuizQuestion {
  id: string;
  category: QuizCategory;
  text: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation?: string;
  /**
   * Source reference. ROADMAP legal checklist requires 2+ citations for
   * health/science questions; we surface the citation field here so a
   * review tool can verify coverage before launch.
   */
  sources?: string[];
}
