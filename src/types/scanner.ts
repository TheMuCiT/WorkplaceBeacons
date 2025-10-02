export const enum ScanState {
  Idle = 'idle',
  Scanning = 'scanning',
}

export interface ScanStatus {
  state: ScanState;
  isScanning: boolean;
  isIdle: boolean;
  canStart: boolean;
  canStop: boolean;
}