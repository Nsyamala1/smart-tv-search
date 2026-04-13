import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ContentResult } from '../services/content';

const SERVICE_COLORS: Record<string, string> = {
  netflix: '#e50914',
  prime: '#00a8e0',
  youtube: '#ff0000',
  disney: '#113ccf',
  hulu: '#1ce783',
};

interface Props {
  item: ContentResult;
  onLaunch: () => void;
}

export default function ContentCard({ item, onLaunch }: Props) {
  const color = SERVICE_COLORS[item.service] ?? '#888';

  return (
    <View style={styles.card}>
      {item.posterUrl ? (
        <Image source={{ uri: item.posterUrl }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.posterPlaceholder]} />
      )}

      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>
          {item.year} • {item.type}
        </Text>
        <Text style={styles.overview} numberOfLines={2}>
          {item.overview}
        </Text>
        <View style={styles.row}>
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{item.service.toUpperCase()}</Text>
          </View>
          <TouchableOpacity style={styles.launchBtn} onPress={onLaunch}>
            <Text style={styles.launchText}>Watch on TV</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  poster: {
    width: 80,
    height: 120,
    backgroundColor: '#2a2a2a',
  },
  posterPlaceholder: {
    backgroundColor: '#2a2a2a',
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  overview: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  launchBtn: {
    backgroundColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  launchText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
