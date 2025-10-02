import React from 'react';
import { View, Text } from 'react-native';

export function PresenceChip({ found }: { found: boolean }) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: found ? '#e6ffed' : '#ffecec',
        borderWidth: 1,
        borderColor: found ? '#34c759' : '#ff3b30',
      }}
    >
      <Text style={{ fontWeight: '600', color: found ? '#1f7a3f' : '#a30000' }}>
        At workplace: {found ? '✅ Found' : '❌ Not Found'}
      </Text>
    </View>
  );
}
