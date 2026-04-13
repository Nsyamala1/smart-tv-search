import axios from 'axios';
import { BACKEND_URL } from './config';

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
  const response = await axios.post(`${BACKEND_URL}/search`, { query });
  return response.data.results;
}
