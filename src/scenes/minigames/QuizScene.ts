import Phaser from 'phaser';
import { DESIGN_TOKENS, MAX_RESOURCE_GAIN_PER_SOURCE } from '@/config/Constants';
import quizData from '@/data/quizQuestions.json';
import type { QuizQuestion } from '@/entities/QuizQuestion';
import { QuizSystem, type AnswerOutcome } from '@/systems/QuizSystem';
import { getServices } from '@/systems/GameServices';
import { i18n } from '@/systems/I18nSystem';

const SECONDS_PER_QUESTION = 15;
const MAX_SHARD_PER_CALL = MAX_RESOURCE_GAIN_PER_SOURCE.quiz.magicShard;
const MAX_TICKET_PER_CALL = MAX_RESOURCE_GAIN_PER_SOURCE.quiz.gachaTicket;

function parseHex(hex: string): number {
  return Number.parseInt(hex.replace('#', ''), 16);
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

function letterFor(index: number): string {
  return OPTION_LETTERS[index] ?? '?';
}

export class QuizScene extends Phaser.Scene {
  private system!: QuizSystem;

  private questionText!: Phaser.GameObjects.Text;

  private optionTexts: Phaser.GameObjects.Text[] = [];

  private progressText!: Phaser.GameObjects.Text;

  private wrongText!: Phaser.GameObjects.Text;

  private feedbackText!: Phaser.GameObjects.Text;

  private timerText!: Phaser.GameObjects.Text;

  private questionStartMs = 0;

  private awaitingNext = false;

  private ending = false;

  constructor() {
    super({ key: 'QuizScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(DESIGN_TOKENS.color.bg);
    this.input.mouse?.disableContextMenu();

    // Daily-cap guard: avoid wasting the user's time + a server round-trip
    // for a session whose grant we already know will be rejected.
    const services = getServices();
    if (services && !services.economy.canStartQuizSession()) {
      this.showCapReachedAndReturn();
      return;
    }

    const pool = quizData.questions as unknown as QuizQuestion[];
    this.system = new QuizSystem(pool, { sessionSize: 10, wrongLimit: 3 });
    this.system.start();
    getServices()?.analytics.emit('minigame_start', { type: 'quiz' });

    this.buildHud();
    this.buildCard();
    this.renderCurrent();
  }

  private showCapReachedAndReturn(): void {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2 - 40, i18n.t('quiz.daily_cap', '오늘은 이미 퀴즈를 풀었어요. 내일 다시 만나요!'), {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.textPrimary,
        align: 'center',
        wordWrap: { width: width - 200 },
      })
      .setOrigin(0.5);

    const services = getServices();
    const canAd = services?.ads.canWatch('quiz_extra_session') ?? false;
    if (canAd) {
      const adBtn = this.add
        .text(
          width / 2,
          height / 2 + 40,
          `[ ${i18n.t('quiz.watch_ad_extra', '📺 광고 보고 한 번 더')} ]`,
          {
            fontFamily: DESIGN_TOKENS.font.family,
            fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
            color: DESIGN_TOKENS.color.primaryDark,
          },
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      adBtn.on('pointerup', () => this.tryAdExtraSession(adBtn));

      this.add
        .text(width / 2, height / 2 + 90, `[ ${i18n.t('common.back', '뒤로')} ]`, {
          fontFamily: DESIGN_TOKENS.font.family,
          fontSize: `${DESIGN_TOKENS.font.sizeMd}px`,
          color: DESIGN_TOKENS.color.textSecondary,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => this.scene.start('MainScene'));
    } else {
      this.time.delayedCall(1500, () => this.scene.start('MainScene'));
    }
  }

  private async tryAdExtraSession(btn: Phaser.GameObjects.Text): Promise<void> {
    const services = getServices();
    if (!services) return;
    btn.disableInteractive();
    btn.setColor(DESIGN_TOKENS.color.textSecondary);
    const res = await services.ads.watch('quiz_extra_session');
    if (!res.ok) {
      btn.setText(`[ ${i18n.t('quiz.ad_failed', '광고 재생 실패 - 다시 시도')} ]`);
      btn.setInteractive({ useHandCursor: true });
      btn.setColor(DESIGN_TOKENS.color.danger);
      return;
    }
    // Reward = 1 extra session: decrement the counter so the cap check
    // passes. Server-side equivalent is the quiz_extra_session ad source
    // bumping the cap allowance, wired in PART 9 server work.
    await services.gameState.patch((d) => ({
      ...d,
      dailyLimits: {
        ...d.dailyLimits,
        quizSessionsUsed: Math.max(0, d.dailyLimits.quizSessionsUsed - 1),
      },
    }));
    // Restart the scene fresh so we re-enter the normal flow.
    this.scene.restart();
  }

  override update(): void {
    if (this.ending || this.awaitingNext || !this.system) return;
    const remaining = this.secondsRemainingForQuestion();
    this.timerText.setText(`⏱ ${remaining}s`);
    if (remaining <= 0) this.onTimeoutCurrent();
  }

  private secondsRemainingForQuestion(): number {
    return Math.max(
      0,
      Math.ceil(SECONDS_PER_QUESTION - (this.time.now - this.questionStartMs) / 1000),
    );
  }

  private buildHud(): void {
    const { width } = this.scale;
    this.progressText = this.add.text(24, 24, '', {
      fontFamily: DESIGN_TOKENS.font.family,
      fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
      color: DESIGN_TOKENS.color.textPrimary,
    });
    this.wrongText = this.add
      .text(width / 2, 24, '', {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.textPrimary,
      })
      .setOrigin(0.5, 0);
    this.timerText = this.add
      .text(width - 24, 24, '', {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.textPrimary,
      })
      .setOrigin(1, 0);

    const endBtn = this.add
      .text(width - 24, 64, `[ ${i18n.t('quiz.end', 'End')} ]`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeMd}px`,
        color: DESIGN_TOKENS.color.primaryDark,
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    endBtn.on('pointerup', () => this.finishSession('user'));
  }

  private buildCard(): void {
    const { width, height } = this.scale;
    const cardW = 900;
    const cardH = 480;
    const x = (width - cardW) / 2;
    const y = 120;

    const bg = this.add.rectangle(x + cardW / 2, y + cardH / 2, cardW, cardH, parseHex(DESIGN_TOKENS.color.bgAlt));
    bg.setStrokeStyle(2, parseHex(DESIGN_TOKENS.color.textSecondary), 0.4);

    this.questionText = this.add
      .text(x + cardW / 2, y + 60, '', {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeXl}px`,
        color: DESIGN_TOKENS.color.textPrimary,
        wordWrap: { width: cardW - 80 },
        align: 'center',
      })
      .setOrigin(0.5, 0);

    for (let i = 0; i < 4; i += 1) {
      const oy = y + 200 + i * 56;
      const opt = this.add
        .text(x + 80, oy, '', {
          fontFamily: DESIGN_TOKENS.font.family,
          fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
          color: DESIGN_TOKENS.color.textPrimary,
        })
        .setInteractive({ useHandCursor: true });
      opt.setData('optionIndex', i);
      opt.on('pointerup', () => this.onPick(i));
      this.optionTexts.push(opt);
    }

    this.feedbackText = this.add
      .text(width / 2, height - 80, '', {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.textSecondary,
      })
      .setOrigin(0.5);
  }

  private renderCurrent(): void {
    const q = this.system.current();
    if (!q) {
      this.finishSession('complete').catch(() => undefined);
      return;
    }
    const r = this.system.results();
    this.progressText.setText(`${r.correct + r.wrong + 1} / ${r.total || 10}`);
    this.wrongText.setText(`❌ ${r.wrong} / 3`);
    this.feedbackText.setText('');
    this.questionText.setText(q.text);
    this.optionTexts.forEach((ot, i) => {
      ot.setText(`${letterFor(i)}. ${q.options[i]}`);
      ot.setColor(DESIGN_TOKENS.color.textPrimary);
    });
    this.questionStartMs = this.time.now;
  }

  private onPick(index: number): void {
    if (this.awaitingNext || this.ending) return;
    const explanation = this.system.current()?.explanation;
    const result = this.system.answer(index);
    this.flashOutcome(result.outcome, index, explanation);
    this.advanceAfterDelay(result.sessionEnded);
  }

  private onTimeoutCurrent(): void {
    if (this.awaitingNext || this.ending) return;
    const explanation = this.system.current()?.explanation;
    const result = this.system.timeout();
    this.flashOutcome(result.outcome, -1, explanation);
    this.advanceAfterDelay(result.sessionEnded);
  }

  private flashOutcome(
    outcome: AnswerOutcome,
    pickedIndex: number,
    explanation: string | undefined,
  ): void {
    let correctIdx = -1;
    if (outcome.kind === 'wrong' || outcome.kind === 'timeout') {
      correctIdx = outcome.correctIndex;
    } else if (outcome.kind === 'correct') {
      correctIdx = pickedIndex;
    }

    // Highlight the correct answer green; if user picked a wrong one,
    // also flag their choice red.
    this.optionTexts.forEach((ot, i) => {
      if (i === correctIdx) ot.setColor(DESIGN_TOKENS.color.success);
      else if (outcome.kind === 'wrong' && i === pickedIndex) {
        ot.setColor(DESIGN_TOKENS.color.danger);
      }
    });

    let label: string;
    let color: string;
    if (outcome.kind === 'correct') {
      label = '정답! 🎉';
      color = DESIGN_TOKENS.color.success;
    } else if (outcome.kind === 'wrong') {
      label = '오답';
      color = DESIGN_TOKENS.color.danger;
    } else {
      label = '시간 초과';
      color = DESIGN_TOKENS.color.danger;
    }
    const text = explanation ? `${label} — ${explanation}` : label;
    this.feedbackText.setColor(color).setText(text);
  }

  private advanceAfterDelay(sessionEnded: boolean): void {
    this.awaitingNext = true;
    this.time.delayedCall(2400, () => {
      this.awaitingNext = false;
      if (sessionEnded) {
        const reason =
          this.system.results().endedBy === 'wrong-limit' ? 'wrong-limit' : 'complete';
        this.finishSession(reason).catch(() => undefined);
        return;
      }
      this.renderCurrent();
    });
  }

  private async finishSession(reason: 'user' | 'complete' | 'wrong-limit'): Promise<void> {
    if (this.ending) return;
    this.ending = true;
    const r = this.system.results();
    const services = getServices();

    // Only completed sessions burn the daily attempt + may grant rewards.
    // Manual quit ('user') leaves the daily counter untouched so an
    // accidental tap on End isn't punished.
    const sessionCounted = reason === 'complete' || reason === 'wrong-limit';
    if (services && sessionCounted) {
      const deltas: { magicShard?: number; gachaTicket?: number } = {};
      if (r.correct > 0) {
        deltas.magicShard = Math.min(r.correct, MAX_SHARD_PER_CALL);
      }
      if (r.perfect) {
        deltas.gachaTicket = Math.min(1, MAX_TICKET_PER_CALL);
      }
      // Calling grant even with empty deltas bumps dailyLimits.quizSessionsUsed
      // server-side — closes the 'fail-3-times to peek answers' exploit.
      // expMultiplier scales the per-correct exp from EXP_BY_SOURCE.quiz.
      await services.economy.grantWithExp('quiz', deltas, {
        expMultiplier: r.correct,
      });
    }
    this.scene.start('MainScene');
  }
}

