import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import SearchBar from '../components/SearchBar';
import ContentCard from '../components/ContentCard';
import { searchContent, ContentResult } from '../services/content';
import { getSelectedDevice, launchSearch, TVDevice } from '../services/dial';

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ContentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [selectedDevice, setSelectedDeviceState] = useState<TVDevice | null>(null);

  useFocusEffect(
    useCallback(() => {
      setSelectedDeviceState(getSelectedDevice());
    }, [])
  );

  async function handleSearch(text: string) {
    if (!text.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const data = await searchContent(text);
      setResults(data);
    } catch {
      Alert.alert('Search failed', 'Could not reach the backend. Is it running?');
    } finally {
      setLoading(false);
    }
  }

  async function handleLaunch(item: ContentResult) {
    const device = getSelectedDevice();
    if (!device) {
      router.push('/devices');
      return;
    }

    setLaunching(true);
    try {
      await launchSearch(device, item);
    } catch {
      Alert.alert('Launch failed', 'Could not send to TV. Please try again.');
    } finally {
      setLaunching(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Describe what you want to watch — AI finds it on your TV
      </Text>

      <SearchBar
        value={query}
        onChangeText={setQuery}
        onSubmit={handleSearch}
        placeholder='e.g. "something like Inception but funnier"'
      />

      <TouchableOpacity
        style={[styles.tvButton, selectedDevice ? styles.tvButtonActive : null]}
        onPress={() => router.push('/devices')}
      >
        {selectedDevice ? (
          <View style={styles.tvButtonRow}>
            <View style={styles.tvDot} />
            <Text style={styles.tvButtonActiveText}>{selectedDevice.friendlyName}</Text>
            <Text style={styles.tvButtonChange}>Change</Text>
          </View>
        ) : (
          <Text style={styles.tvButtonText}>Select TV</Text>
        )}
      </TouchableOpacity>

      {(loading || launching) && (
        <ActivityIndicator size="large" color="#e50914" style={styles.loader} />
      )}

      <ScrollView style={styles.results} keyboardShouldPersistTaps="handled">
        {results.map((item) => (
          <ContentCard
            key={`${item.service}-${item.id}`}
            item={item}
            onLaunch={() => handleLaunch(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    padding: 16,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  tvButton: {
    borderColor: '#444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  tvButtonActive: {
    borderColor: '#e50914',
    backgroundColor: '#1a0a0a',
  },
  tvButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tvDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e50914',
  },
  tvButtonText: {
    color: '#ccc',
    fontSize: 14,
  },
  tvButtonActiveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  tvButtonChange: {
    color: '#888',
    fontSize: 12,
  },
  loader: {
    marginTop: 32,
  },
  results: {
    flex: 1,
  },
});
