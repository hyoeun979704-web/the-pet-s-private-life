import Phaser from 'phaser';
import { DESIGN_TOKENS } from '@/config/Constants';
import charactersData from '@/data/characters.json';
import type { CharacterDef } from '@/entities/Character';
import { GachaSystem, type GachaRollResult } from '@/systems/GachaSystem';
import { getServices } from '@/systems/GameServices';
import { i18n } from '@/systems/I18nSystem';

function parseHex(hex: string): number {
  return Number.parseInt(hex.replace('#', ''), 16);
}

const GRADE_COLOR: Record<'normal' | 'rare' | 'legendary', string> = {
  normal: DESIGN_TOKENS.color.bgAlt,
  rare: DESIGN_TOKENS.color.accent,
  legendary: DESIGN_TOKENS.color.danger,
};

const GRADE_LABEL: Record<'normal' | 'rare' | 'legendary', string> = {
  normal: '일반',
  rare: '희귀',
  legendary: '전설',
};

export class GachaScene extends Phaser.Scene {
  private gacha!: GachaSystem;

  private stoneText!: Phaser.GameObjects.Text;

  private rollBtn!: Phaser.GameObjects.Text;

  private resultLayer!: Phaser.GameObjects.Container;

  private rolling = false;

  private unsubState: (() => void) | null = null;

  constructor() {
    super({ key: 'GachaScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(DESIGN_TOKENS.color.bg);
    this.input.mouse?.disableContextMenu();

    const services = getServices();
    if (!services) {
      this.add.text(20, 20, 'services not initialized');
      return;
    }
    this.gacha = new GachaSystem({ gameState: services.gameState });

    this.buildHud();
    this.resultLayer = this.add.container(0, 0);
    this.refreshHud();
    this.unsubState = services.gameState.subscribe(() => this.refreshHud());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubState?.());
  }

  private buildHud(): void {
    const { width } = this.scale;

    this.add
      .text(width / 2, 60, i18n.t('gacha.title', '가챠'), {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeXl}px`,
        color: DESIGN_TOKENS.color.textPrimary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);

    this.stoneText = this.add
      .text(width / 2, 130, '', {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.textPrimary,
      })
      .setOrigin(0.5, 0);

    this.rollBtn = this.add
      .text(width / 2, 220, `[ ${i18n.t('gacha.roll', '뽑기 (1 마법돌)')} ]`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeXl}px`,
        color: DESIGN_TOKENS.color.primaryDark,
      })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true });
    this.rollBtn.on('pointerup', () => this.doRoll());

    const ratesBtn = this.add
      .text(width / 2, 290, `[ ${i18n.t('gacha.viewRates', '확률 공시 보기')} ]`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeMd}px`,
        color: DESIGN_TOKENS.color.textSecondary,
      })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true });
    ratesBtn.on('pointerup', () =>
      this.scene.start('GachaRatesScene', { returnTo: 'GachaScene' }),
    );

    const adChanceBtn = this.add
      .text(width / 2, 340, `[ 📺 ${i18n.t('gacha.adChance', '광고 보고 50% 확률 가챠권')} ]`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeMd}px`,
        color: DESIGN_TOKENS.color.primaryDark,
      })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true });
    adChanceBtn.on('pointerup', () => this.tryAdTicketChance(adChanceBtn));

    const backBtn = this.add
      .text(24, 24, `[ ${i18n.t('common.back', '뒤로')} ]`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeMd}px`,
        color: DESIGN_TOKENS.color.primaryDark,
      })
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });
    backBtn.on('pointerup', () => this.scene.start('MainScene'));
  }

  private refreshHud(): void {
    if (!this.stoneText) return;
    const services = getServices();
    if (!services) return;
    const { magicStone, magicShard } = services.gameState.get().resources;
    const pity = services.gameState.get().gachaPity;
    this.stoneText.setText(`🔮 ${magicStone}   🧩 ${magicShard}   pity ${pity}/20`);
    const can = this.gacha.canRoll() && !this.rolling;
    this.rollBtn.setColor(can ? DESIGN_TOKENS.color.primaryDark : DESIGN_TOKENS.color.textSecondary);
  }

  private async doRoll(): Promise<void> {
    if (this.rolling) return;
    if (!this.gacha.canRoll()) {
      this.flashMessage(i18n.t('gacha.notEnough', '마법돌이 부족해요.'));
      return;
    }
    this.rolling = true;
    this.refreshHud();
    const result = await this.gacha.roll();
    this.rolling = false;
    if (result.ok) this.showResult(result);
    else this.flashMessage(this.reasonText(result.reason));
    this.refreshHud();
  }

  private reasonText(reason: GachaRollResult['reason']): string {
    if (reason === 'not-enough-stone') return i18n.t('gacha.notEnough', '마법돌이 부족해요.');
    if (reason === 'offline') return i18n.t('gacha.offline', '서버 연결에 문제가 있어요.');
    return i18n.t('gacha.serverDenied', '뽑기에 실패했어요.');
  }

  private showResult(res: GachaRollResult): void {
    this.resultLayer.removeAll(true);
    if (!res.grade || !res.defId) return;
    const { grade } = res;
    const defs = charactersData.characters as unknown as CharacterDef[];
    const def = defs.find((d) => d.id === res.defId);
    if (!def) return;

    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2 + 60;

    const bg = this.add.rectangle(cx, cy, 480, 280, parseHex(DESIGN_TOKENS.color.bgAlt));
    bg.setStrokeStyle(2, parseHex(GRADE_COLOR[grade]));
    this.resultLayer.add(bg);

    const swatch = this.add.circle(cx, cy - 60, 40, parseHex(def.colorHex));
    swatch.setStrokeStyle(2, parseHex(DESIGN_TOKENS.color.textPrimary));
    this.resultLayer.add(swatch);

    const lines = [
      `${GRADE_LABEL[grade]}  ${def.breed}`,
      res.isNew ? '🎉 new!' : `중복 → 🧩 +${res.shardGain ?? 0}`,
      `pity ${res.pity ?? 0}/20`,
    ];
    const text = this.add
      .text(cx, cy + 10, lines.join('\n'), {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.textPrimary,
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5);
    this.resultLayer.add(text);
  }

  private async tryAdTicketChance(btn: Phaser.GameObjects.Text): Promise<void> {
    const services = getServices();
    if (!services) return;
    if (!services.ads.canWatch('gacha_ticket_chance')) {
      this.flashMessage(i18n.t('gacha.adChance_capReached', '오늘 이 보상은 이미 받았어요.'));
      return;
    }
    btn.disableInteractive();
    btn.setColor(DESIGN_TOKENS.color.textSecondary);
    const res = await services.ads.watch('gacha_ticket_chance');
    if (!res.ok) {
      this.flashMessage(i18n.t('gacha.adChance_failed', '광고 재생 실패'));
      btn.setInteractive({ useHandCursor: true });
      btn.setColor(DESIGN_TOKENS.color.primaryDark);
      return;
    }
    // 50% chance to award one gachaTicket via the ad_reward source.
    const won = Math.random() < 0.5;
    if (won) {
      await services.economy.grant('ad_reward', { snack: 0 }); // count the watch even on draw
      // ad_reward source caps don't include gachaTicket — patch directly
      // since this is a placement-specific bonus and not a generic grant.
      await services.gameState.patch((d) => ({
        ...d,
        resources: {
          ...d.resources,
          gachaTicket: d.resources.gachaTicket + 1,
        },
      }));
      this.flashMessage(i18n.t('gacha.adChance_won', '🎉 가챠권 +1!'));
    } else {
      this.flashMessage(i18n.t('gacha.adChance_lost', '아쉬워요! 다음 기회에…'));
    }
  }

  private flashMessage(msg: string): void {
    this.resultLayer.removeAll(true);
    const t = this.add
      .text(this.scale.width / 2, this.scale.height / 2 + 60, msg, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.danger,
      })
      .setOrigin(0.5);
    this.resultLayer.add(t);
  }
}
