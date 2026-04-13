import axios from 'axios';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

export interface TMDBResult {
  id: number;
  title: string;
  overview: string;
  year: string;
  type: 'movie' | 'show';
  posterUrl?: string;
}

export async function searchTMDB(
  term: string,
  type: 'movie' | 'show' | 'any' = 'any'
): Promise<TMDBResult[]> {
  const apiKey = process.env.TMDB_API_KEY;
  const endpoint = type === 'movie'
    ? '/search/movie'
    : type === 'show'
    ? '/search/tv'
    : '/search/multi';

  const response = await axios.get(`${TMDB_BASE}${endpoint}`, {
    params: { api_key: apiKey, query: term, page: 1 },
  });

  const results = response.data.results ?? [];

  return results.slice(0, 5).map((r: any) => ({
    id: r.id,
    title: r.title ?? r.name,
    overview: r.overview ?? '',
    year: (r.release_date ?? r.first_air_date ?? '').slice(0, 4),
    type: r.media_type === 'tv' || type === 'show' ? 'show' : 'movie',
    posterUrl: r.poster_path ? `${TMDB_IMAGE_BASE}${r.poster_path}` : undefined,
  }));
}
