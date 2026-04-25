import { initializeApp } from 'firebase-admin/app';
import { addResources } from './addResources';
import { consumeFatigue } from './consumeFatigue';
import { deleteAccount } from './deleteAccount';
import { initPlayer } from './initPlayer';
import { purchaseFurniture } from './purchaseFurniture';
import { rollGacha } from './rollGacha';
import { validatePurchase } from './validatePurchase';

initializeApp();

export {
  addResources,
  consumeFatigue,
  deleteAccount,
  initPlayer,
  purchaseFurniture,
  rollGacha,
  validatePurchase,
};
