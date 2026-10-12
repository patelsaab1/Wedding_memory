import { config } from '../../config/index.js';
import { createStorageManager } from './create-storage-manager.js';

/** @type {import('./storage-manager.js').StorageManager | undefined} */
let storageManager;

/**
 * Process-wide StorageManager singleton.
 * Controllers/services should call this — never instantiate Drive/R2 SDKs.
 */
export function getStorageManager() {
  if (!storageManager) {
    storageManager = createStorageManager(config);
  }
  return storageManager;
}

/**
 * Test helper — replace or clear the singleton.
 * @param {import('./storage-manager.js').StorageManager | undefined} manager
 */
export function setStorageManagerForTests(manager) {
  storageManager = manager;
}
