import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { discoverDevices, connectManually, setSelectedDevice, TVDevice } from '../services/dial';

export default function DevicesScreen() {
  const [devices, setDevices] = useState<TVDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [manualIp, setManualIp] = useState('');
  const [connecting, setConnecting] = useState(false);

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

  async function handleManualConnect() {
    const ip = manualIp.trim();
    if (!ip) return;
    setConnecting(true);
    try {
      const device = await connectManually(ip);
      setSelectedDevice(device);
      router.back();
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? `Could not connect to ${ip}`;
      Alert.alert('Connection failed', msg);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.heading}>Select your TV</Text>

      {/* Manual connect */}
      <View style={styles.manualCard}>
        <Text style={styles.manualTitle}>Connect by IP address</Text>
        <Text style={styles.manualSub}>
          Fire TV / Android TV / Chromecast with Google TV{'\n'}
          Find the IP on your TV: Settings → Network
        </Text>
        <View style={styles.manualRow}>
          <TextInput
            style={styles.ipInput}
            placeholder="e.g. 192.168.1.100"
            placeholderTextColor="#555"
            value={manualIp}
            onChangeText={setManualIp}
            keyboardType="numeric"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleManualConnect}
          />
          <TouchableOpacity
            style={[styles.connectBtn, connecting && styles.connectBtnDisabled]}
            onPress={handleManualConnect}
            disabled={connecting}
          >
            {connecting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.connectBtnText}>Connect</Text>
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or scan network</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* SSDP scan results */}
      {scanning && (
        <View style={styles.scanRow}>
          <ActivityIndicator color="#e50914" />
          <Text style={styles.scanText}>Scanning local network...</Text>
        </View>
      )}

      {!scanning && devices.length === 0 && (
        <Text style={styles.empty}>No TVs found automatically.</Text>
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

      <TouchableOpacity style={styles.rescan} onPress={scan} disabled={scanning}>
        <Text style={styles.rescanText}>Scan again</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', padding: 16 },
  heading: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 16 },

  manualCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  manualTitle: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  manualSub: { color: '#666', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  manualRow: { flexDirection: 'row', gap: 8 },
  ipInput: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
  },
  connectBtn: {
    backgroundColor: '#e50914',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectBtnDisabled: { opacity: 0.6 },
  connectBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#222' },
  dividerText: { color: '#444', fontSize: 12 },

  scanRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  scanText: { color: '#888' },
  empty: { color: '#555', textAlign: 'center', marginTop: 16, marginBottom: 16 },

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
    marginTop: 8,
  },
  rescanText: { color: '#ccc' },
});
