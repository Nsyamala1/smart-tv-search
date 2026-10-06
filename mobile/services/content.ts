import axios from 'axios';
import { SEARCH_URL, SEARCH_HEADERS } from './config';

export interface ContentResult {
  id: string;
  title: string;
  overview: string;
  year: string;
  type: 'movie' | 'show';
  service: string;
  deepLinkUrl?: string;
  searchQuery: string;
  posterUrl?: string;
}

export async function searchContent(query: string): Promise<ContentResult[]> {
  const response = await axios.post(
    `${SEARCH_URL}/search`,
    { query },
    { headers: SEARCH_HEADERS, timeout: 20000 }
  );
  return response.data.results;
}
