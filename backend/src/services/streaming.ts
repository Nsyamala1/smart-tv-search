import axios from 'axios';

export interface StreamingAvailability {
  service: string;
  deepLinkUrl?: string;
  searchQuery: string;
}

// JustWatch has no official public API — we use their internal search endpoint.
// This may break; swap in a paid API (Streaming Availability by MovieOfTheNight) if needed.
const JUSTWATCH_SEARCH = 'https://apis.justwatch.com/contentpartner/v2/content/offers/object_type/movie/locale/en_US';

const KNOWN_SERVICES = ['netflix', 'prime', 'youtube', 'disney', 'hulu', 'apple'];

/**
 * Returns which streaming services have this title.
 * Falls back to a best-guess list if JustWatch is unavailable.
 */
export async function getStreamingAvailability(
  tmdbId: number,
  type: 'movie' | 'show',
  title: string
): Promise<StreamingAvailability[]> {
  try {
    const response = await axios.get(
      `https://apis.justwatch.com/content/titles/${type === 'movie' ? 'movie' : 'show'}/${tmdbId}/locale/en_US`,
      { timeout: 5000 }
    );

    const offers: any[] = response.data?.offers ?? [];
    const seen = new Set<string>();
    const results: StreamingAvailability[] = [];

    for (const offer of offers) {
      const service = normalizeService(offer.package_short_name);
      if (!service || seen.has(service)) continue;
      seen.add(service);
      results.push({
        service,
        deepLinkUrl: buildDeepLink(service, tmdbId, type),
        searchQuery: title,
      });
    }

    return results.length > 0 ? results : fallback(title);
  } catch {
    return fallback(title);
  }
}

function normalizeService(name: string): string | null {
  const map: Record<string, string> = {
    nfx: 'netflix',
    amp: 'prime',
    yt: 'youtube',
    dnp: 'disney',
    hlu: 'hulu',
    atp: 'apple',
  };
  return map[name] ?? null;
}

function buildDeepLink(service: string, id: number, type: 'movie' | 'show'): string | undefined {
  // Android TV deep links (most reliable cross-platform)
  switch (service) {
    case 'netflix':
      return `https://www.netflix.com/watch/${id}`;
    case 'prime':
      return `https://www.amazon.com/dp/${id}`;
    case 'youtube':
      return `https://www.youtube.com/results?search_query=${id}`;
    default:
      return undefined;
  }
}

function fallback(title: string): StreamingAvailability[] {
  // Can't determine availability — return a generic search fallback
  return [
    { service: 'youtube', searchQuery: title },
  ];
}
