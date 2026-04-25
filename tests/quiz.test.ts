import { describe, it, expect } from 'vitest';
import type { QuizQuestion } from '@/entities/QuizQuestion';
import { QuizSystem } from '@/systems/QuizSystem';

function mkQ(id: string, correct: 0 | 1 | 2 | 3 = 0): QuizQuestion {
  return {
    id,
    category: 'general',
    text: `Q ${id}`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex: correct,
  };
}

const POOL: QuizQuestion[] = Array.from({ length: 20 }, (_, i) =>
  mkQ(`q${i}`, (i % 4) as 0 | 1 | 2 | 3),
);

describe('QuizSystem', () => {
  it('start() picks exactly sessionSize questions', () => {
    const sys = new QuizSystem(POOL, { sessionSize: 10, rand: () => 0 });
    sys.start();
    expect(sys.current()).not.toBeNull();
    let seen = 0;
    while (!sys.isFinished()) {
      const cur = sys.current();
      if (!cur) break;
      sys.answer(cur.correctIndex);
      seen += 1;
    }
    expect(seen).toBe(10);
    expect(sys.results().total).toBe(10);
  });

  it('session size caps at pool size', () => {
    const tiny: QuizQuestion[] = [mkQ('a'), mkQ('b')];
    const sys = new QuizSystem(tiny, { sessionSize: 10 });
    sys.start();
    sys.answer(tiny[0]!.correctIndex);
    sys.answer(tiny[1]!.correctIndex);
    expect(sys.results().total).toBe(2);
    expect(sys.isFinished()).toBe(true);
  });

  it('correct answers increment correct count', () => {
    const sys = new QuizSystem(POOL, { sessionSize: 3, rand: () => 0 });
    sys.start();
    for (let i = 0; i < 3; i += 1) {
      const cur = sys.current();
      if (!cur) break;
      const res = sys.answer(cur.correctIndex);
      expect(res.outcome.kind).toBe('correct');
    }
    expect(sys.results().correct).toBe(3);
    expect(sys.results().perfect).toBe(true);
  });

  it('wrong answer is reported with correctIndex', () => {
    const sys = new QuizSystem(POOL, { sessionSize: 2, rand: () => 0 });
    sys.start();
    const cur = sys.current()!;
    const wrongIndex = ((cur.correctIndex + 1) % 4) as 0 | 1 | 2 | 3;
    const res = sys.answer(wrongIndex);
    expect(res.outcome.kind).toBe('wrong');
    if (res.outcome.kind === 'wrong') {
      expect(res.outcome.correctIndex).toBe(cur.correctIndex);
    }
  });

  it('3 wrong answers end the session early with endedBy=wrong-limit', () => {
    const sys = new QuizSystem(POOL, { sessionSize: 10, wrongLimit: 3, rand: () => 0 });
    sys.start();
    for (let i = 0; i < 3; i += 1) {
      const cur = sys.current();
      if (!cur) break;
      sys.answer(((cur.correctIndex + 1) % 4) as 0 | 1 | 2 | 3);
    }
    expect(sys.isFinished()).toBe(true);
    expect(sys.results().endedBy).toBe('wrong-limit');
  });

  it('timeout() counts as wrong and exposes correctIndex', () => {
    const sys = new QuizSystem(POOL, { sessionSize: 2, wrongLimit: 3, rand: () => 0 });
    sys.start();
    const cur = sys.current()!;
    const res = sys.timeout();
    expect(res.outcome.kind).toBe('timeout');
    if (res.outcome.kind === 'timeout') {
      expect(res.outcome.correctIndex).toBe(cur.correctIndex);
    }
    expect(sys.results().wrong).toBe(1);
  });

  it('perfect flag false when wrong > 0', () => {
    const sys = new QuizSystem(POOL, { sessionSize: 2, rand: () => 0 });
    sys.start();
    const cur = sys.current()!;
    sys.answer(((cur.correctIndex + 1) % 4) as 0 | 1 | 2 | 3);
    const cur2 = sys.current()!;
    sys.answer(cur2.correctIndex);
    expect(sys.results().perfect).toBe(false);
  });

  it('current() returns null after session ends', () => {
    const sys = new QuizSystem(POOL, { sessionSize: 1, rand: () => 0 });
    sys.start();
    const cur = sys.current()!;
    sys.answer(cur.correctIndex);
    expect(sys.current()).toBeNull();
    expect(sys.isFinished()).toBe(true);
    expect(sys.results().endedBy).toBe('complete');
  });

  it('answer() after session ends throws', () => {
    const sys = new QuizSystem(POOL, { sessionSize: 1, rand: () => 0 });
    sys.start();
    const cur = sys.current()!;
    sys.answer(cur.correctIndex);
    expect(() => sys.answer(0)).toThrow();
  });

  it('start() resets a previously finished session', () => {
    const sys = new QuizSystem(POOL, { sessionSize: 1, rand: () => 0 });
    sys.start();
    sys.answer(sys.current()!.correctIndex);
    expect(sys.isFinished()).toBe(true);
    sys.start();
    expect(sys.isFinished()).toBe(false);
    expect(sys.current()).not.toBeNull();
    expect(sys.results().correct).toBe(0);
  });
});
