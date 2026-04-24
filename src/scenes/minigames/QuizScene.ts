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

    const pool = quizData.questions as unknown as QuizQuestion[];
    this.system = new QuizSystem(pool, { sessionSize: 10, wrongLimit: 3 });
    this.system.start();

    this.buildHud();
    this.buildCard();
    this.renderCurrent();
  }

  override update(): void {
    if (this.ending || this.awaitingNext) return;
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
    const result = this.system.answer(index);
    this.flashOutcome(result.outcome, index);
    this.advanceAfterDelay(result.sessionEnded);
  }

  private onTimeoutCurrent(): void {
    if (this.awaitingNext || this.ending) return;
    const result = this.system.timeout();
    this.flashOutcome(result.outcome, -1);
    this.advanceAfterDelay(result.sessionEnded);
  }

  private flashOutcome(outcome: AnswerOutcome, pickedIndex: number): void {
    let correctIdx = -1;
    if (outcome.kind === 'wrong') correctIdx = outcome.correctIndex;
    else if (outcome.kind === 'correct') correctIdx = pickedIndex;

    // Highlight the correct answer green; if user picked a wrong one,
    // also flag their choice red.
    this.optionTexts.forEach((ot, i) => {
      if (i === correctIdx) ot.setColor(DESIGN_TOKENS.color.success);
      else if (outcome.kind === 'wrong' && i === pickedIndex) {
        ot.setColor(DESIGN_TOKENS.color.danger);
      }
    });

    if (outcome.kind === 'correct') {
      this.feedbackText.setColor(DESIGN_TOKENS.color.success).setText('정답! 🎉');
    } else if (outcome.kind === 'wrong') {
      this.feedbackText.setColor(DESIGN_TOKENS.color.danger).setText('오답');
    } else {
      this.feedbackText.setColor(DESIGN_TOKENS.color.danger).setText('시간 초과');
    }
  }

  private advanceAfterDelay(sessionEnded: boolean): void {
    this.awaitingNext = true;
    this.time.delayedCall(1200, () => {
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

  private async finishSession(_reason: 'user' | 'complete' | 'wrong-limit'): Promise<void> {
    if (this.ending) return;
    this.ending = true;
    const r = this.system.results();
    const services = getServices();
    if (services && (r.correct > 0 || r.perfect)) {
      const deltas: { magicShard?: number; gachaTicket?: number } = {};
      if (r.correct > 0) {
        deltas.magicShard = Math.min(r.correct, MAX_SHARD_PER_CALL);
      }
      if (r.perfect) {
        deltas.gachaTicket = Math.min(1, MAX_TICKET_PER_CALL);
      }
      await services.economy.grant('quiz', deltas);
    }
    this.scene.start('MainScene');
  }
}

