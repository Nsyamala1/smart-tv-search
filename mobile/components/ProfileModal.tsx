import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

const SERVICE_LABELS: Record<string, string> = {
  youtube:  'YouTube',
  netflix:  'Netflix',
  prime:    'Prime Video',
  disney:   'Disney+',
  hulu:     'Hulu',
  apple:    'Apple TV+',
};

interface Props {
  visible: boolean;
  service: string;
  title: string;
  tvName: string;
  loading: boolean;
  onContinue: () => void;
  onCancel: () => void;
}

export default function ProfileModal({
  visible,
  service,
  title,
  tvName,
  loading,
  onContinue,
  onCancel,
}: Props) {
  const appName = SERVICE_LABELS[service] ?? service;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{appName}</Text>
          </View>

          <Text style={styles.title}>Select your profile on the TV</Text>

          <Text style={styles.body}>
            {appName} is now open on{' '}
            <Text style={styles.bold}>{tvName}</Text>.{'\n\n'}
            Select your profile using the TV remote, then tap{' '}
            <Text style={styles.bold}>Continue</Text> to search for{' '}
            <Text style={styles.bold}>"{title}"</Text>.
          </Text>

          {loading ? (
            <ActivityIndicator color="#e50914" style={styles.loader} />
          ) : (
            <>
              <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
                <Text style={styles.continueBtnText}>Continue to Search</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#e50914',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  bold: {
    color: '#fff',
    fontWeight: '600',
  },
  continueBtn: {
    backgroundColor: '#e50914',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: '#666',
    fontSize: 14,
  },
  loader: {
    marginVertical: 20,
  },
});
