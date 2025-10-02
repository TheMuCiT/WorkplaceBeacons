import React from 'react';
import { View, Text, Button } from 'react-native';
import { PresenceChip } from '../components/PresenceChip';
import { BeaconList } from '../components/BeaconList';
import { WHITELIST } from '../config/whitelist';
import { useBeaconScanner } from '../hooks/useBeaconScanner';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ScanState } from '../types/scanner';

function formatTime(ts: number | null) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString();
}

export default function BeaconScreen() {
  const { state, start, stop, allCount, top5, found, lastUpdate } =
    useBeaconScanner(WHITELIST);

  return (
    <SafeAreaProvider>
      <View style={{ padding: 16, gap: 16, paddingTop: 80, flex: 1 }}>
        <PresenceChip found={found} />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button
            title="Start Scan"
            onPress={start}
            disabled={state === ScanState.Scanning}
          />
          <Button
            title="Stop Scan"
            onPress={stop}
            disabled={state === ScanState.Idle}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 24 }}>
          <Text style={{ fontSize: 16 }}>
            Detected (all):{' '}
            <Text style={{ fontWeight: '700' }}>{allCount}</Text>
          </Text>
          <Text style={{ fontSize: 16 }}>
            Last update:{' '}
            <Text style={{ fontWeight: '700' }}>{formatTime(lastUpdate)}</Text>
          </Text>
        </View>

        <BeaconList beacons={top5} />
      </View>
    </SafeAreaProvider>
  );
}
