import type { QuizQuestion } from '@/entities/QuizQuestion';

export interface QuizSystemOptions {
  sessionSize?: number;
  wrongLimit?: number;
  rand?: () => number;
}

export type AnswerOutcome =
  | { kind: 'correct' }
  | { kind: 'wrong'; correctIndex: number }
  | { kind: 'timeout' };

export interface AnswerResult {
  outcome: AnswerOutcome;
  /** True when this answer ended the session (all done OR wrong-limit hit). */
  sessionEnded: boolean;
  /** 0-indexed position of the question we just answered. */
  index: number;
}

export interface SessionResults {
  correct: number;
  wrong: number;
  total: number;
  perfect: boolean;
  endedBy: 'complete' | 'wrong-limit';
}

const DEFAULT_SESSION_SIZE = 10;
const DEFAULT_WRONG_LIMIT = 3;

export class QuizSystem {
  private readonly pool: readonly QuizQuestion[];

  private readonly sessionSize: number;

  private readonly wrongLimit: number;

  private readonly rand: () => number;

  private picked: QuizQuestion[] = [];

  private index = 0;

  private correct = 0;

  private wrong = 0;

  private ended = false;

  private endedBy: SessionResults['endedBy'] = 'complete';

  constructor(pool: readonly QuizQuestion[], opts: QuizSystemOptions = {}) {
    this.pool = pool;
    this.sessionSize = opts.sessionSize ?? DEFAULT_SESSION_SIZE;
    this.wrongLimit = opts.wrongLimit ?? DEFAULT_WRONG_LIMIT;
    this.rand = opts.rand ?? Math.random;
  }

  /**
   * Starts a new session by picking `sessionSize` random questions from the
   * pool without replacement. Safe to call multiple times; resets state.
   */
  start(): void {
    this.picked = this.pickSession();
    this.index = 0;
    this.correct = 0;
    this.wrong = 0;
    this.ended = false;
    this.endedBy = 'complete';
  }

  current(): QuizQuestion | null {
    if (this.ended) return null;
    return this.picked[this.index] ?? null;
  }

  isFinished(): boolean {
    return this.ended;
  }

  results(): SessionResults {
    return {
      correct: this.correct,
      wrong: this.wrong,
      total: this.picked.length,
      perfect: this.correct === this.picked.length && this.correct > 0,
      endedBy: this.endedBy,
    };
  }

  answer(optionIndex: number): AnswerResult {
    const q = this.current();
    if (!q) throw new Error('answer() called after session ended');
    const { correctIndex } = q;
    const isCorrect = optionIndex === correctIndex;
    const idx = this.index;

    if (isCorrect) this.correct += 1;
    else this.wrong += 1;

    const outcome: AnswerOutcome = isCorrect
      ? { kind: 'correct' }
      : { kind: 'wrong', correctIndex };

    return this.afterAnswer(outcome, idx);
  }

  /** Call when the per-question timer hit zero. Treated as a wrong answer. */
  timeout(): AnswerResult {
    const q = this.current();
    if (!q) throw new Error('timeout() called after session ended');
    this.wrong += 1;
    const idx = this.index;
    return this.afterAnswer({ kind: 'timeout' }, idx);
  }

  private afterAnswer(outcome: AnswerOutcome, idx: number): AnswerResult {
    this.index += 1;
    if (this.wrong >= this.wrongLimit) {
      this.ended = true;
      this.endedBy = 'wrong-limit';
    } else if (this.index >= this.picked.length) {
      this.ended = true;
      this.endedBy = 'complete';
    }
    return { outcome, sessionEnded: this.ended, index: idx };
  }

  private pickSession(): QuizQuestion[] {
    const count = Math.min(this.sessionSize, this.pool.length);
    // Fisher–Yates partial shuffle for the first `count` slots of a copy.
    const copy = this.pool.slice();
    for (let i = 0; i < count; i += 1) {
      const j = i + Math.floor(this.rand() * (copy.length - i));
      const ii = copy[i]!;
      const jj = copy[j]!;
      copy[i] = jj;
      copy[j] = ii;
    }
    return copy.slice(0, count);
  }
}
