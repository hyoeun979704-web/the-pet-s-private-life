import { initializeApp } from 'firebase-admin/app';
import { addResources } from './addResources';
import { consumeFatigue } from './consumeFatigue';
import { rollGacha } from './rollGacha';

initializeApp();

export { addResources, consumeFatigue, rollGacha };
