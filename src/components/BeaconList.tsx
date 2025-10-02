import React from 'react';
import { FlatList, Text, View } from 'react-native';
import type { BeaconReading } from '../types/beacon';

function shortenUuid(uuid: string) {
  const u = uuid.toLowerCase();
  return `${u.slice(0, 8)}…${u.slice(-4)}`;
}

export function BeaconList({ beacons }: { beacons: BeaconReading[] }) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8 }}>
        Top 5 by signal
      </Text>
      {beacons.length === 0 ? (
        <Text style={{ color: '#666' }}>No beacons detected yet</Text>
      ) : (
        <FlatList
          data={beacons}
          keyExtractor={b => `${b.uuid}|${b.major}|${b.minor}`}
          renderItem={({ item }) => (
            <View
              style={{
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: '#eee',
              }}
            >
              <Text style={{ fontWeight: '600' }}>
                {shortenUuid(item.uuid)} • {item.major}/{item.minor}
              </Text>
              <Text style={{ color: '#333' }}>RSSI: {item.rssi} dBm</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
