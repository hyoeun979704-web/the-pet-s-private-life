import Phaser from 'phaser';
import { bindNetworkEvents, isOnline } from '@/utils/NetworkUtil';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    bindNetworkEvents();
    if (!isOnline()) {
      this.scene.start('OfflineScene');
      return;
    }
    this.scene.start('LoadingScene');
  }
}
