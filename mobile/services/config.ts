// The app talks to two servers:
//
//   SEARCH_URL  AI search. Hosted on the internet (Railway), works from anywhere.
//   TV_URL      TV control. Runs at home on the same Wi-Fi as the TV, because
//               only a machine on your network can reach the TV.
//
// Set these in mobile/.env (see .env.example). Expo reads EXPO_PUBLIC_* at build time.
// Find your Mac's IP: System Settings → Wi-Fi → Details, or run: ipconfig getifaddr en0

const DEV_MACHINE_IP = '192.168.1.159';

const trim = (u: string) => u.replace(/\/+$/, '');

export const SEARCH_URL = trim(
  process.env.EXPO_PUBLIC_SEARCH_URL ?? `http://${DEV_MACHINE_IP}:3001`
);
export const TV_URL = trim(process.env.EXPO_PUBLIC_TV_URL ?? `http://${DEV_MACHINE_IP}:3001`);

// Sent as the x-app-token header. Note: anything shipped inside an app can be
// extracted, so these only stop casual misuse. The server's rate limit and
// daily cap are what actually bound the cost.
export const SEARCH_HEADERS = { 'x-app-token': process.env.EXPO_PUBLIC_APP_TOKEN ?? '' };
export const TV_HEADERS = { 'x-app-token': process.env.EXPO_PUBLIC_TV_TOKEN ?? '' };
