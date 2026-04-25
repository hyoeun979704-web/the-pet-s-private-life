import Phaser from 'phaser';
import { DESIGN_TOKENS } from '@/config/Constants';
import charactersData from '@/data/characters.json';
import type { CharacterDef } from '@/entities/Character';
import { GachaSystem } from '@/systems/GachaSystem';
import { i18n } from '@/systems/I18nSystem';

function parseHex(hex: string): number {
  return Number.parseInt(hex.replace('#', ''), 16);
}

function pct(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

/**
 * Legal-disclosure scene. Required by Korean & Google Play probability
 * regulations for any gacha. Shows:
 *   - cost per roll
 *   - per-grade rates
 *   - pity policy
 *   - duplicate-to-shard conversion
 *   - the full pool of pickable characters
 *
 * Players can reach this from MainScene and from GachaScene (via a link
 * on the gacha screen — required for the disclosure to be 'visible'
 * during the purchase flow per platform guidelines).
 */
export class GachaRatesScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GachaRatesScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(DESIGN_TOKENS.color.bg);
    this.input.mouse?.disableContextMenu();

    const d = GachaSystem.disclosure();
    const defs = charactersData.characters as unknown as CharacterDef[];
    const defById = new Map(defs.map((x) => [x.id, x]));

    const { width } = this.scale;

    this.add
      .text(width / 2, 32, i18n.t('gacha.rates.title', '가챠 확률 공시'), {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeXl}px`,
        color: DESIGN_TOKENS.color.textPrimary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);

    const summaryY = 110;
    const summaryLines = [
      i18n.t('gacha.rates.cost', `1회 ${d.cost} 마법돌`),
      i18n.t('gacha.rates.pity', `${d.pity}회 천장 (${d.pity}연속 일반 시 다음 뽑기는 희귀+ 확정)`),
      i18n.t('gacha.rates.duplicate', '중복 시 마법돌 조각으로 자동 변환'),
    ];
    this.add
      .text(width / 2, summaryY, summaryLines.join('\n'), {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeMd}px`,
        color: DESIGN_TOKENS.color.textSecondary,
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5, 0);

    const ratesHeader = this.add
      .text(width / 2, 240, i18n.t('gacha.rates.header', '등급별 확률'), {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.textPrimary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);

    const colY = ratesHeader.y + 50;
    const cols: Array<{ key: 'normal' | 'rare' | 'legendary'; label: string; color: string }> = [
      { key: 'normal',    label: '일반',  color: DESIGN_TOKENS.color.bgAlt },
      { key: 'rare',      label: '희귀',  color: DESIGN_TOKENS.color.accent },
      { key: 'legendary', label: '전설',  color: DESIGN_TOKENS.color.danger },
    ];
    cols.forEach((col, i) => {
      const cx = (width / 4) * (i + 1);
      const rate = d.rates[col.key];
      const shardOnDup = d.duplicateShardReward[col.key];
      const block = [
        col.label,
        pct(rate),
        i18n.t('gacha.rates.dupReward', `중복: 조각 ${shardOnDup}`),
      ].join('\n');
      const swatch = this.add.rectangle(cx, colY + 24, 80, 8, parseHex(col.color));
      swatch.setStrokeStyle(1, parseHex(DESIGN_TOKENS.color.textPrimary));
      this.add
        .text(cx, colY + 40, block, {
          fontFamily: DESIGN_TOKENS.font.family,
          fontSize: `${DESIGN_TOKENS.font.sizeMd}px`,
          color: DESIGN_TOKENS.color.textPrimary,
          align: 'center',
          lineSpacing: 6,
        })
        .setOrigin(0.5, 0);
    });

    const poolHeader = this.add
      .text(width / 2, colY + 180, i18n.t('gacha.rates.poolHeader', '획득 가능 캐릭터'), {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.textPrimary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);

    let listY = poolHeader.y + 50;
    cols.forEach((col) => {
      const ids = d.pool[col.key];
      const names = ids
        .map((id) => defById.get(id)?.breed ?? id)
        .join(', ');
      const line = `${col.label} (${ids.length}종): ${names}`;
      const t = this.add
        .text(width / 2, listY, line, {
          fontFamily: DESIGN_TOKENS.font.family,
          fontSize: `${DESIGN_TOKENS.font.sizeSm}px`,
          color: DESIGN_TOKENS.color.textSecondary,
          align: 'center',
          wordWrap: { width: width - 200 },
        })
        .setOrigin(0.5, 0);
      listY += t.height + 16;
    });

    const backBtn = this.add
      .text(width / 2, this.scale.height - 60, `[ ${i18n.t('common.back', '돌아가기')} ]`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.primaryDark,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    backBtn.on('pointerup', () => this.scene.start('MainScene'));
  }
}
