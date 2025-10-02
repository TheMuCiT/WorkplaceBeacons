import { useCallback, useMemo, useRef, useState } from 'react';
import type { WhitelistEntry, BeaconReading } from '../types/beacon';
import { startMockRanging, generateMockPool } from '../mocks/mockBeacons';
import { smoothRssi } from '../utils/rssi';
import {
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import { ScanState } from '../types/scanner';

type ScannerState = ScanState;
type Region = {
  identifier?: string;
  uuid: string;
  major?: number;
  minor?: number;
};

const USE_MOCK = __DEV__;

function resolveBeaconsManager(): any | null {
  const nm: any = NativeModules;
  const candidates = [
    nm?.BeaconsManager,
    nm?.Beacons,
    nm?.RNiBeacon,
    ...Object.keys(nm || {})
      .filter(k => /beacon/i.test(k))
      .map(k => (nm as any)[k]),
  ].filter(Boolean);
  return candidates[0] ?? null;
}

function createEmitterFromManager(mgr: any) {
  if (Platform.OS === 'ios') return mgr ? new NativeEventEmitter(mgr) : null;
  return DeviceEventEmitter;
}

export function useBeaconScanner(whitelist: WhitelistEntry[]) {
  const [state, setState] = useState<ScannerState>(ScanState.Idle);
  const [allCount, setAllCount] = useState(0);
  const [top5, setTop5] = useState<BeaconReading[]>([]);
  const [found, setFound] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const mapRef = useRef<Map<string, BeaconReading>>(new Map());
  const subRef = useRef<{ remove?: () => void } | null>(null);
  const stopMockRef = useRef<null | (() => void)>(null);

  const regions: Region[] = useMemo(
    () =>
      whitelist.map(w => ({
        identifier: `${w.uuid}-${w.major}-${w.minor}`,
        uuid: w.uuid,
        major: w.major,
        minor: w.minor,
      })),
    [whitelist],
  );

  const processBatch = useCallback(
    (
      items: Array<{
        uuid: string;
        major: number;
        minor: number;
        rssi: number;
      }>,
    ) => {
      const now = Date.now();
      let matched = false;
      const map = mapRef.current;

      for (const b of items) {
        if (typeof b.uuid !== 'string') continue;
        const uuid = b.uuid.toLowerCase();
        const major = Number(b.major);
        const minor = Number(b.minor);
        const rssi = Number(b.rssi);
        if (Number.isNaN(rssi) || rssi === 0) continue;

        const key = `${uuid}|${major}|${minor}`;
        const prev = map.get(key);
        const avg = smoothRssi(prev?.avgRssi, rssi, 0.6);
        map.set(key, { uuid, major, minor, rssi, lastSeen: now, avgRssi: avg });

        if (!matched) {
          for (const w of whitelist) {
            if (
              uuid === w.uuid.toLowerCase() &&
              major === w.major &&
              minor === w.minor
            ) {
              matched = true;
              break;
            }
          }
        }
      }

      for (const [k, v] of Array.from(map.entries())) {
        if (now - v.lastSeen > 15000) map.delete(k);
      }

      setAllCount(map.size);
      setLastUpdate(now);
      const arr = Array.from(map.values())
        .sort((a, b) => (b.avgRssi ?? b.rssi) - (a.avgRssi ?? a.rssi))
        .slice(0, 5);
      setTop5(arr);

      if (matched) {
        setFound(true);
        stop();
      }
    },
    [whitelist],
  );

  const start = useCallback(async () => {
    if (state === ScanState.Scanning) return;
    setState(ScanState.Scanning);
    setFound(false);
    setAllCount(0);
    setTop5([]);
    setLastUpdate(Date.now());
    mapRef.current.clear();

    if (USE_MOCK) {
      const pool = generateMockPool({
        count: 1000,
        seed: 12,
        uuidFamilies: [
          'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
        ],
      });
      stopMockRef.current = startMockRanging(batch => processBatch(batch), {
        pool,
        whitelist,
        intervalMs: 1000,
        maxPerTick: 90,
        includeWhitelistHitsProb: 0.25,
        gapPattern: [8, 5],
        seed: 777,
      });
      return;
    }

    const mgr = resolveBeaconsManager();
    if (!mgr) {
      console.warn('[beacons] Native manager not available; aborting Start.');
      setState(ScanState.Idle);
      return;
    }

    if (Platform.OS === 'ios') {
      try {
        mgr.requestWhenInUseAuthorization?.();
        mgr.allowsBackgroundLocationUpdates?.(false);
        mgr.shouldDropEmptyRanges?.(true);
        mgr.startUpdatingLocation?.();
        mgr.stopUpdatingLocation?.();
      } catch (e) {
        console.warn('[beacons] iOS setup failed:', e);
      }
    }

    for (const r of regions) {
      try {
        await mgr.startRangingBeaconsInRegion?.(r);
      } catch (e) {
        console.warn('[beacons] startRanging error', r, e);
      }
    }

    const emitter = createEmitterFromManager(mgr);
    if (!emitter || !(emitter as any).addListener) {
      console.warn('[beacons] Emitter unavailable; reverting to idle.');
      setState(ScanState.Idle);
      return;
    }

    const sub = (emitter as any).addListener('beaconsDidRange', (data: any) => {
      const items = Array.isArray(data?.beacons) ? data.beacons : [];
      processBatch(items);
    });
    subRef.current = sub;
  }, [regions, state, whitelist, processBatch]);

  const stop = useCallback(async () => {
    if (state === ScanState.Idle) return;
    setState(ScanState.Idle);

    if (stopMockRef.current) {
      try {
        stopMockRef.current();
      } catch {}
      stopMockRef.current = null;
    }

    try {
      subRef.current?.remove?.();
    } catch {}
    subRef.current = null;

    if (!USE_MOCK) {
      const mgr = resolveBeaconsManager();
      if (mgr) {
        for (const r of regions) {
          try {
            await mgr.stopRangingBeaconsInRegion?.(r);
          } catch (e) {
            console.warn('[beacons] stopRanging error', r, e);
          }
        }
      }
    }
  }, [regions, state]);

  return { state, start, stop, allCount, top5, found, lastUpdate };
}
