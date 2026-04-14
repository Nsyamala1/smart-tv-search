import axios from 'axios';

export interface StreamingAvailability {
  service: string;
  deepLinkUrl?: string;
  searchQuery: string;
}

const TMDB_BASE = 'https://api.themoviedb.org/3';

// Maps TMDB provider IDs to our internal service names
const PROVIDER_ID_MAP: Record<number, string> = {
  8:   'netflix',
  9:   'prime',
  10:  'prime',
  337: 'disney',
  15:  'hulu',
  2:   'apple',
  192: 'youtube',
  188: 'youtube',
};

/**
 * Uses TMDB's official watch providers endpoint to find streaming availability.
 * Falls back to YouTube search if unavailable.
 */
export async function getStreamingAvailability(
  tmdbId: number,
  type: 'movie' | 'show',
  title: string
): Promise<StreamingAvailability[]> {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    const endpoint = type === 'movie'
      ? `/movie/${tmdbId}/watch/providers`
      : `/tv/${tmdbId}/watch/providers`;

    const response = await axios.get(`${TMDB_BASE}${endpoint}`, {
      params: { api_key: apiKey },
      timeout: 5000,
    });

    // Use US providers — expand to other regions as needed
    const usProviders = response.data?.results?.US;
    if (!usProviders) return fallback(title);

    // Combine flatrate (subscription) + free providers
    const providers: any[] = [
      ...(usProviders.flatrate ?? []),
      ...(usProviders.free ?? []),
      ...(usProviders.ads ?? []),
    ];

    const seen = new Set<string>();
    const results: StreamingAvailability[] = [];

    for (const provider of providers) {
      const service = PROVIDER_ID_MAP[provider.provider_id];
      if (!service || seen.has(service)) continue;
      seen.add(service);
      results.push({
        service,
        deepLinkUrl: buildDeepLink(service, tmdbId, type),
        searchQuery: title,
      });
    }

    // Always include YouTube as a fallback option
    if (!seen.has('youtube')) {
      results.push({ service: 'youtube', searchQuery: title });
    }

    return results.length > 0 ? results : fallback(title);
  } catch {
    return fallback(title);
  }
}

function buildDeepLink(service: string, id: number, _type: 'movie' | 'show'): string | undefined {
  switch (service) {
    case 'netflix': return `https://www.netflix.com/watch/${id}`;
    case 'prime':   return `https://www.amazon.com/dp/${id}`;
    default:        return undefined;
  }
}

function fallback(title: string): StreamingAvailability[] {
  return [
    { service: 'netflix',  searchQuery: title },
    { service: 'prime',    searchQuery: title },
    { service: 'youtube',  searchQuery: title },
    { service: 'disney',   searchQuery: title },
    { service: 'hulu',     searchQuery: title },
  ];
}
