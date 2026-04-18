/**
 * SlipGo extension points — reserved for future Pro / enterprise features.
 * Do not wire into UI yet; implementations stay no-op or throw "not implemented".
 */

export interface CloudBackupAdapter {
  exportDatabase(): Promise<Uint8Array>;
  importDatabase(data: Uint8Array): Promise<void>;
}

export interface MultiDeviceSyncAdapter {
  sync(): Promise<void>;
}

export interface AnalyticsAdapter {
  track(event: string, props?: Record<string, string | number>): void;
}

export interface InventoryAdapter {
  getStock(sku: string): Promise<number>;
}

export interface MultiBranchAdapter {
  branchId: string | null;
  listBranches(): Promise<{id: string; name: string}[]>;
}

/** Replace with real adapters when products ship */
export const extensionPoints = {
  cloudBackup: null as CloudBackupAdapter | null,
  sync: null as MultiDeviceSyncAdapter | null,
  analytics: null as AnalyticsAdapter | null,
  inventory: null as InventoryAdapter | null,
  branches: null as MultiBranchAdapter | null,
};
