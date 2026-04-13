import { Router, Request, Response } from 'express';
import { parseSearchIntent } from '../services/claude';
import { searchTMDB } from '../services/tmdb';
import { getStreamingAvailability } from '../services/streaming';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'query is required' });
    return;
  }

  try {
    // Step 1: Parse natural language intent with Claude
    const intent = await parseSearchIntent(query);

    // Step 2: Search TMDB for matching titles
    const allResults = await Promise.all(
      intent.searchTerms.slice(0, 2).map((term) => searchTMDB(term, intent.type))
    );

    // Deduplicate by TMDB id
    const seen = new Set<number>();
    const tmdbResults = allResults.flat().filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    // Step 3: Enrich with streaming availability (top 3 results)
    const enriched = await Promise.all(
      tmdbResults.slice(0, 3).map(async (result) => {
        const streaming = await getStreamingAvailability(result.id, result.type, result.title);
        return streaming.map((s) => ({
          id: String(result.id),
          title: result.title,
          overview: result.overview,
          year: result.year,
          type: result.type,
          posterUrl: result.posterUrl,
          service: s.service,
          deepLinkUrl: s.deepLinkUrl,
          searchQuery: s.searchQuery,
        }));
      })
    );

    res.json({ results: enriched.flat() });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
