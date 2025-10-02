export type WhitelistEntry = {
  uuid: string;
  major: number;
  minor: number;
};

export type BeaconKey = string;

export type BeaconReading = {
  uuid: string;
  major: number;
  minor: number;
  rssi: number;
  lastSeen: number;
  avgRssi?: number;
};
