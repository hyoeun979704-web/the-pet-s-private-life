import { initializeApp } from 'firebase-admin/app';
import { addResources } from './addResources';
import { consumeFatigue } from './consumeFatigue';
import { initPlayer } from './initPlayer';
import { purchaseFurniture } from './purchaseFurniture';
import { rollGacha } from './rollGacha';

initializeApp();

export { addResources, consumeFatigue, initPlayer, purchaseFurniture, rollGacha };
