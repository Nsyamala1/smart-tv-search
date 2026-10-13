import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getSelectedDevice, loadSelectedDevice, sendKey, RemoteKey, TVDevice } from '../services/dial';

function Btn({ label, k, onPress, wide }: { label: string; k: RemoteKey; onPress: (k: RemoteKey) => void; wide?: boolean }) {
  return (
    <TouchableOpacity style={[styles.btn, wide && styles.wide]} onPress={() => onPress(k)}>
      <Text style={styles.btnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function RemoteScreen() {
  const [device, setDevice] = useState<TVDevice | null>(getSelectedDevice());
  const [error, setError] = useState('');

  useEffect(() => {
    loadSelectedDevice().then(setDevice);
  }, []);

  async function press(key: RemoteKey) {
    if (!device) return;
    try {
      setError('');
      await sendKey(device, key);
    } catch {
      setError('That button did not reach the TV. Is the helper running on your Mac?');
    }
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.hint}>Pick a TV first, then come back here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{device.friendlyName}</Text>
      <View style={styles.row}><Btn label="▲" k="up" onPress={press} /></View>
      <View style={styles.row}>
        <Btn label="◀" k="left" onPress={press} />
        <Btn label="OK" k="select" onPress={press} />
        <Btn label="▶" k="right" onPress={press} />
      </View>
      <View style={styles.row}><Btn label="▼" k="down" onPress={press} /></View>
      <View style={styles.row}>
        <Btn label="Back" k="back" onPress={press} />
        <Btn label="Home" k="home" onPress={press} />
      </View>
      <View style={styles.row}>
        <Btn label="⏪" k="rewind" onPress={press} />
        <Btn label="⏯" k="playpause" onPress={press} />
        <Btn label="⏩" k="forward" onPress={press} />
      </View>
      <View style={styles.row}>
        <Btn label="Vol −" k="voldown" onPress={press} />
        <Btn label="Mute" k="mute" onPress={press} />
        <Btn label="Vol +" k="volup" onPress={press} />
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', alignItems: 'center', paddingTop: 24 },
  title: { color: '#fff', fontSize: 18, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  btn: { backgroundColor: '#2a2a2a', minWidth: 76, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
  wide: { minWidth: 120 },
  btnText: { color: '#fff', fontSize: 18 },
  hint: { color: '#aaa', marginTop: 40 },
  error: { color: '#e57373', marginTop: 16, paddingHorizontal: 24, textAlign: 'center' },
});
