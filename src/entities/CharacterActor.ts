import type { GridPos } from '@/utils/IsometricUtil';
import type { MoodState } from './Character';

export const TIRED_THRESHOLD = 2;

export interface ActorState {
  defId: string;
  pos: GridPos;
  mood: MoodState;
  targetPos: GridPos | null;
  nextDecisionAt: number;
}

export interface ActorEnv {
  roomW: number;
  roomH: number;
  now: () => number;
  rand: () => number;
  fatigueOf: (defId: string) => number;
}

const IDLE_MIN_MS = 1_500;
const IDLE_MAX_MS = 4_000;
const WANDER_MIN_MS = 1_000;
const WANDER_MAX_MS = 2_500;

function rangeInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function stepToward(from: GridPos, to: GridPos): GridPos {
  const dx = Math.sign(to.gx - from.gx);
  const dy = Math.sign(to.gy - from.gy);
  return { gx: from.gx + dx, gy: from.gy + dy };
}

function randomTarget(env: ActorEnv): GridPos {
  return {
    gx: rangeInt(env.rand, 0, env.roomW - 1),
    gy: rangeInt(env.rand, 0, env.roomH - 1),
  };
}

export function createActor(defId: string, pos: GridPos, now: number): ActorState {
  return {
    defId,
    pos: { ...pos },
    mood: 'idle',
    targetPos: null,
    nextDecisionAt: now,
  };
}

/**
 * Advance the actor's mood and, when wandering, step one tile toward the
 * target. Returns the (possibly same) actor state. Pure given ActorEnv.
 */
export function stepActor(actor: ActorState, env: ActorEnv): ActorState {
  const fatigue = env.fatigueOf(actor.defId);
  if (fatigue <= 0) {
    return { ...actor, mood: 'sleep', targetPos: null };
  }

  let next = actor;
  if (fatigue <= TIRED_THRESHOLD && next.mood !== 'tired') {
    next = { ...next, mood: 'tired', targetPos: null };
  }

  const t = env.now();
  if (t < next.nextDecisionAt) return next;

  if (next.mood === 'wander' && next.targetPos) {
    const arrived = next.pos.gx === next.targetPos.gx && next.pos.gy === next.targetPos.gy;
    if (arrived) {
      return {
        ...next,
        mood: 'idle',
        targetPos: null,
        nextDecisionAt: t + rangeInt(env.rand, IDLE_MIN_MS, IDLE_MAX_MS),
      };
    }
    const step = stepToward(next.pos, next.targetPos);
    return { ...next, pos: step, nextDecisionAt: t + 250 };
  }

  // idle / tired -> decide next action
  if (next.mood === 'tired') {
    return { ...next, nextDecisionAt: t + IDLE_MAX_MS };
  }

  const target = randomTarget(env);
  return {
    ...next,
    mood: 'wander',
    targetPos: target,
    nextDecisionAt: t + rangeInt(env.rand, WANDER_MIN_MS, WANDER_MAX_MS),
  };
}
