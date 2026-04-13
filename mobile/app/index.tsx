import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import SearchBar from '../components/SearchBar';
import ContentCard from '../components/ContentCard';
import { searchContent, ContentResult } from '../services/content';
import { getSelectedDevice } from '../services/dial';

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ContentResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(text: string) {
    if (!text.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const data = await searchContent(text);
      setResults(data);
    } catch (err) {
      Alert.alert('Search failed', 'Could not reach the backend. Is it running?');
    } finally {
      setLoading(false);
    }
  }

  async function handleLaunch(item: ContentResult) {
    const device = await getSelectedDevice();
    if (!device) {
      router.push('/devices');
      return;
    }
    const { launchOnTV } = await import('../services/dial');
    await launchOnTV(device, item);
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
        style={styles.tvButton}
        onPress={() => router.push('/devices')}
      >
        <Text style={styles.tvButtonText}>Select TV</Text>
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator size="large" color="#e50914" style={styles.loader} />
      )}

      <ScrollView style={styles.results}>
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
  tvButtonText: {
    color: '#ccc',
    fontSize: 14,
  },
  loader: {
    marginTop: 32,
  },
  results: {
    flex: 1,
  },
});
