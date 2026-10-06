# Smart TV Search Companion

Use your phone to search Netflix, YouTube, Prime Video and more on your Smart TV — with AI-powered natural language search.

## How it works

1. Open the app on your phone
2. Type or speak what you want: *"something like Inception but funnier"*
3. AI finds the best match and which streaming service has it
4. Your TV opens directly to that content

## Architecture

```
Phone App (React Native/Expo)
  └── AI Layer (Claude API) — natural language → content match
  └── Content Search (TMDB + JustWatch) — find title + streaming availability
  └── DIAL Protocol — discover TV on local WiFi
  └── Deep Link / Auto-type — launch content on TV
```

## Platform Support

| Platform | Deep Link | Fallback (launch + search) |
|---|---|---|
| Android TV / Google TV | ✅ | ✅ |
| Samsung Tizen | ⚠️ | ✅ |
| LG webOS | ⚠️ | ✅ |
| Roku | ⚠️ | ✅ |
| Fire TV | ⚠️ | ✅ |

## Project Structure

```
smart-tv-search/
├── mobile/        # Expo React Native phone app
└── backend/       # Node.js/Express API (AI + content search)
```

## Setup

### Backend
```bash
cd backend
cp .env.example .env
# Fill in ANTHROPIC_API_KEY and TMDB_API_KEY
npm install
npm run dev
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key |
| `TMDB_API_KEY` | The Movie Database API key (free) |
| `PORT` | Backend port (default: 3001) |

## Running in two places

The backend runs in one of three modes, set by `MODE`:

| MODE | Serves | Where it runs |
|---|---|---|
| `search` (default) | `/search` only | Railway, reachable from anywhere |
| `tv` | `/devices/*` only | At home, on the same Wi-Fi as the TV (needs `adb`) |
| `all` | both | Local development |

Both halves require an `x-app-token` header (`APP_TOKEN` for search, `TV_TOKEN` for TV control)
and refuse all requests if their token is not set. Search is also limited per IP
(`SEARCH_PER_MINUTE`) and per day in total (`DAILY_SEARCH_LIMIT`).

The phone app reads `EXPO_PUBLIC_SEARCH_URL`, `EXPO_PUBLIC_TV_URL`, `EXPO_PUBLIC_APP_TOKEN`
and `EXPO_PUBLIC_TV_TOKEN` from `mobile/.env`. See `mobile/.env.example`.

On Railway, set the service root directory to `backend`.
