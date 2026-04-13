import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { discoverDevices, setSelectedDevice, TVDevice } from '../services/dial';

export default function DevicesScreen() {
  const [devices, setDevices] = useState<TVDevice[]>([]);
  const [scanning, setScanning] = useState(false);

  async function scan() {
    setScanning(true);
    setDevices([]);
    const found = await discoverDevices();
    setDevices(found);
    setScanning(false);
  }

  useEffect(() => {
    scan();
  }, []);

  function selectDevice(device: TVDevice) {
    setSelectedDevice(device);
    router.back();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Available TVs on your network</Text>

      {scanning && (
        <View style={styles.scanRow}>
          <ActivityIndicator color="#e50914" />
          <Text style={styles.scanText}>Scanning local network...</Text>
        </View>
      )}

      {!scanning && devices.length === 0 && (
        <Text style={styles.empty}>
          No DIAL-compatible TVs found.{'\n'}Make sure your phone and TV are on the same WiFi.
        </Text>
      )}

      <FlatList
        data={devices}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.device} onPress={() => selectDevice(item)}>
            <Text style={styles.deviceName}>{item.friendlyName}</Text>
            <Text style={styles.deviceSub}>{item.manufacturer} — {item.ip}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.rescan} onPress={scan}>
        <Text style={styles.rescanText}>Scan again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', padding: 16 },
  heading: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  scanRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  scanText: { color: '#888' },
  empty: { color: '#666', textAlign: 'center', marginTop: 40, lineHeight: 24 },
  device: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  deviceName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deviceSub: { color: '#888', fontSize: 13, marginTop: 4 },
  rescan: {
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  rescanText: { color: '#ccc' },
});
