import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export interface ParsedIntent {
  searchTerms: string[];
  mood?: string;
  genre?: string;
  type: 'movie' | 'show' | 'any';
  similarTo?: string;
}

/**
 * Uses Claude to parse a natural language query into structured search intent.
 * e.g. "something like Inception but funnier" →
 *   { searchTerms: ["Inception", "comedy thriller"], mood: "funny", similarTo: "Inception", type: "movie" }
 */
export async function parseSearchIntent(query: string): Promise<ParsedIntent> {
  const message = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: `You are a movie/TV search assistant. Parse the user's natural language query into a structured JSON object.
Return ONLY valid JSON with these fields:
- searchTerms: string[] (2-4 TMDB-friendly search terms, most specific first)
- mood: string (optional, e.g. "funny", "dark", "romantic")
- genre: string (optional, e.g. "thriller", "comedy")
- type: "movie" | "show" | "any"
- similarTo: string (optional, title they referenced)`,
    messages: [{ role: 'user', content: query }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}';

  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
  } catch {
    return { searchTerms: [query], type: 'any' };
  }
}
