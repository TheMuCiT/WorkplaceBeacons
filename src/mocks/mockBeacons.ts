import type {WhitelistEntry} from '../types/beacon';

export type MockBeacon = { uuid: string; major: number; minor: number; rssi: number };

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rand: () => number, min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

export function generateMockPool(opts?: {
  count?: number;
  seed?: number;
  uuidFamilies?: string[];
}) {
  const {
    count = 300,
    seed = 123,
    uuidFamilies = [
      'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    ],
  } = opts || {};
  const rand = mulberry32(seed);

  const pool: MockBeacon[] = [];
  for (let i = 0; i < count; i++) {
    const uuid = uuidFamilies[randInt(rand, 0, uuidFamilies.length - 1)];
    const major = randInt(rand, 1, 500);
    const minor = randInt(rand, 0, 500);
    const rssi = -40 - randInt(rand, 0, 55);
    pool.push({ uuid, major, minor, rssi });
  }
  return pool;
}

export function startMockRanging(
  onBatch: (beacons: MockBeacon[]) => void,
  opts: {
    pool: MockBeacon[];
    whitelist?: WhitelistEntry[];
    intervalMs?: number;
    maxPerTick?: number;
    includeWhitelistHitsProb?: number;
    gapPattern?: number[];
    seed?: number;
  }
): () => void {
  const {
    pool,
    whitelist = [],
    intervalMs = 1000,
    maxPerTick = 30,
    includeWhitelistHitsProb = 0.35,
    gapPattern = [],
    seed = 999,
  } = opts;

  const rand = mulberry32(seed);
  let tick = 0;
  let gapIdx = 0;
  let gapCount = 0;

  const choose = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

  const id = setInterval(() => {
    tick++;

    let allowHit = true;
    if (gapPattern.length > 0) {
      const phaseLen = gapPattern[gapIdx % gapPattern.length];
      const isGapPhase = gapIdx % 2 === 1;
      if (gapCount >= phaseLen) {
        gapIdx++;
        gapCount = 0;
      }
      allowHit = !isGapPhase;
      gapCount++;
    }

    const out: MockBeacon[] = [];

    const N = Math.min(maxPerTick, pool.length);
    for (let i = 0; i < N; i++) {
      const b = choose(pool);
      const jitter = (rand() - 0.5) * 6;
      out.push({ ...b, rssi: Math.round(b.rssi + jitter) });
    }

    const shouldInject =
      allowHit &&
      whitelist.length > 0 &&
      rand() < includeWhitelistHitsProb;

    if (shouldInject) {
      const w = choose(whitelist);
      out.push({ uuid: w.uuid, major: w.major, minor: w.minor, rssi: -45 });
    }

    onBatch(out);
  }, intervalMs);

  return () => clearInterval(id);
}
