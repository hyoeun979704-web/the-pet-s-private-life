import Phaser from 'phaser';
import { DESIGN_TOKENS, GAME_META } from '@/config/Constants';
import loadingData from '@/data/loading_texts.json';
import { i18n } from '@/systems/I18nSystem';

const MIN_DISPLAY_MS = 1200;
const MAX_DISPLAY_MS = 10_000;
const TIP_ROTATION_MS = 3000;

const TIPS: readonly string[] = loadingData.tips as unknown as string[];

export class LoadingScene extends Phaser.Scene {
  private tipText!: Phaser.GameObjects.Text;

  private tipIndex = 0;

  private rotateTimer: Phaser.Time.TimerEvent | null = null;

  private startedAtMs = 0;

  constructor() {
    super({ key: 'LoadingScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(DESIGN_TOKENS.color.bgAlt);
    this.startedAtMs = this.time.now;

    this.add
      .text(width / 2, height / 2 - 40, i18n.t('common.loading', 'Loading…'), {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.textPrimary,
      })
      .setOrigin(0.5);

    this.tipIndex = Math.floor(Math.random() * Math.max(1, TIPS.length));
    this.tipText = this.add
      .text(width / 2, height / 2 + 20, this.currentTip(), {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeMd}px`,
        color: DESIGN_TOKENS.color.textSecondary,
        align: 'center',
        wordWrap: { width: width - 200 },
      })
      .setOrigin(0.5);

    this.add
      .text(10, height - 24, `v${GAME_META.version}`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeSm}px`,
        color: DESIGN_TOKENS.color.textSecondary,
      })
      .setOrigin(0, 1);

    this.rotateTimer = this.time.addEvent({
      delay: TIP_ROTATION_MS,
      loop: true,
      callback: () => this.rotateTip(),
    });

    this.time.delayedCall(MIN_DISPLAY_MS, () => this.proceed());
    this.time.delayedCall(MAX_DISPLAY_MS, () => this.networkWarn());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.rotateTimer?.remove());
  }

  private currentTip(): string {
    const direct = TIPS[this.tipIndex] ?? '';
    return i18n.t('loading.tip', direct);
  }

  private rotateTip(): void {
    if (TIPS.length <= 1) return;
    this.tipIndex = (this.tipIndex + 1) % TIPS.length;
    this.tipText.setText(TIPS[this.tipIndex] ?? '');
  }

  private proceed(): void {
    if (!this.scene.isActive('LoadingScene')) return;
    this.scene.start('MainScene');
  }

  private networkWarn(): void {
    if (!this.scene.isActive('LoadingScene')) return;
    // We're past min display + still here → real assets must be slow.
    // The actual asset loader hooks in PART 13 will replace this with
    // a real progress bar; for now we just transition to MainScene.
    this.scene.start('MainScene');
  }
}
