import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import { discoverDialDevices, TVDevice } from '../services/dial';

const execAsync = promisify(exec);
const router = Router();

// GET /devices/discover
router.get('/discover', async (_req: Request, res: Response) => {
  try {
    const devices = await discoverDialDevices(5000);
    res.json({ devices });
  } catch (err) {
    console.error('Discovery error:', err);
    res.status(500).json({ error: 'Discovery failed' });
  }
});

// POST /devices/launch-app — Step 1: open the app only (no search)
// Used to let the user select their profile on the TV first.
router.post('/launch-app', async (req: Request, res: Response) => {
  const { device, service } = req.body as { device: TVDevice; service: string };
  if (!device || !service) {
    res.status(400).json({ error: 'device and service are required' });
    return;
  }
  try {
    console.log(`Opening app: ${service} on ${device.friendlyName}`);
    if (device.platform === 'fire-tv' || device.platform === 'android-tv') {
      await openAppViaAdb(device, service);
    } else {
      await launchViaDial(device, service, '');
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Launch-app error:', err);
    res.status(500).json({ error: 'Could not open app' });
  }
});

// POST /devices/launch-search — Step 2: send search query to the already-open app
// Called after the user has selected their profile on the TV.
router.post('/launch-search', async (req: Request, res: Response) => {
  const { device, content } = req.body as {
    device: TVDevice;
    content: { service: string; searchQuery: string; title: string };
  };
  if (!device || !content) {
    res.status(400).json({ error: 'device and content are required' });
    return;
  }
  try {
    console.log(`Searching: "${content.searchQuery}" on ${device.friendlyName} via ${content.service}`);
    if (device.platform === 'fire-tv' || device.platform === 'android-tv') {
      if (content.service === 'youtube') {
        // YouTube: deep-link works whether the app is open or not — one shot
        await searchViaAdb(device, content.service, content.searchQuery);
      } else {
        // Other apps: open the app, wait for it to be ready, then search via keycodes.
        // The wait covers cold-start time and gives users a moment to select their profile
        // if Netflix/Disney+ show a profile picker.
        await openAppViaAdb(device, content.service);
        await new Promise(resolve => setTimeout(resolve, 4000));
        await searchViaKeycodes(device, content.searchQuery);
      }
    } else {
      await launchViaDial(device, content.service, content.searchQuery);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Launch-search error:', err);
    res.status(500).json({ error: 'Could not send search to TV' });
  }
});

// Step 1: open the app without force-stopping so an existing session is preserved
async function openAppViaAdb(device: TVDevice, service: string) {
  const pkg = ADB_PACKAGES[service];
  if (!pkg) throw new Error(`Unknown service: ${service}`);
  const adbTarget = `${device.ip}:5555`;
  await execAsync(`adb connect ${adbTarget}`);
  const { stdout } = await execAsync(
    `adb -s ${adbTarget} shell monkey -p ${pkg} -c android.intent.category.LAUNCHER 1`
  );
  console.log('Open app stdout:', stdout.trim());
}

// Step 2a: YouTube — deep-link directly into the already-running app
async function searchViaAdb(device: TVDevice, service: string, searchQuery: string) {
  const pkg = ADB_PACKAGES[service];
  if (!pkg) throw new Error(`Unknown service: ${service}`);
  const adbTarget = `${device.ip}:5555`;
  await execAsync(`adb connect ${adbTarget}`);
  const intent = buildSearchIntent(service, searchQuery, pkg);
  console.log(`Search intent: ${intent}`);
  const { stdout, stderr } = await execAsync(`adb -s ${adbTarget} shell ${intent}`);
  console.log('ADB stdout:', stdout.trim());
  if (stderr.trim()) console.log('ADB stderr:', stderr.trim());
}

// Step 2b: Netflix/Disney+/Prime/Hulu on Fire TV.
// URL VIEW intents are ignored when the app is already running (onNewIntent not wired up).
// Instead we simulate the user pressing the Search button on the remote (KEYCODE_SEARCH),
// wait for the in-app search UI to appear, then type the query and confirm.
// This works entirely within the existing session so the profile selection is preserved.
async function searchViaKeycodes(device: TVDevice, searchQuery: string) {
  const adbTarget = `${device.ip}:5555`;
  await execAsync(`adb connect ${adbTarget}`);

  // Simulate pressing the search / mic button on the Fire TV remote
  await execAsync(`adb -s ${adbTarget} shell input keyevent KEYCODE_SEARCH`);

  // Give the in-app search UI time to open (Netflix/Disney+ need ~1.5 s)
  await new Promise(resolve => setTimeout(resolve, 1500));

  // `input text` sends the string to the focused text field.
  // Spaces must be passed as %s; strip quotes to keep the shell command safe.
  const textToType = searchQuery.replace(/ /g, '%s').replace(/['"]/g, '');
  await execAsync(`adb -s ${adbTarget} shell input text "${textToType}"`);

  // Small pause, then confirm the search
  await new Promise(resolve => setTimeout(resolve, 500));
  await execAsync(`adb -s ${adbTarget} shell input keyevent KEYCODE_ENTER`);

  console.log(`Keycode search sent: "${searchQuery}"`);
}

function buildSearchIntent(service: string, searchQuery: string, pkg: string): string {
  // --activity-clear-top navigates within the existing session without killing the app
  // This preserves the user's profile selection
  const flags = '--activity-clear-top';
  const q = encodeURIComponent(searchQuery);

  switch (service) {
    case 'youtube':
      return `am start ${flags} -a android.intent.action.VIEW -d "youtube://search?query=${q}" -n ${pkg}/dev.cobalt.app.MainActivity`;
    case 'netflix':
      return `am start ${flags} -a android.intent.action.VIEW -d "https://www.netflix.com/search?q=${q}" -n ${pkg}/.MainActivity`;
    case 'prime':
      return `am start ${flags} -a android.intent.action.VIEW -d "https://app.primevideo.com/search?phrase=${q}"`;
    case 'disney':
      return `am start ${flags} -a android.intent.action.VIEW -d "https://www.disneyplus.com/search?q=${q}" -n com.disney.disneyplus/com.bamtechmedia.dominguez.main.MainActivity`;
    case 'hulu':
      return `am start ${flags} -a android.intent.action.VIEW -d "hulu://search?q=${q}" -n ${pkg}/.SplashActivity`;
    default:
      return `am start ${flags} -n ${pkg}/.MainActivity`;
  }
}

async function launchViaDial(device: TVDevice, service: string, searchQuery: string) {
  const appName = DIAL_APP_NAMES[service] ?? service;
  const url = `${device.dialUrl}/${appName}`;
  const body = searchQuery ? `query=${encodeURIComponent(searchQuery)}` : '';
  try {
    await axios.post(url, body, { headers: { 'Content-Type': 'text/plain' }, timeout: 5000 });
  } catch (err: any) {
    if (err?.response?.status === 404 && body) {
      await axios.post(url, '', { headers: { 'Content-Type': 'text/plain' }, timeout: 5000 });
    } else {
      throw err;
    }
  }
}

const ADB_PACKAGES: Record<string, string> = {
  youtube: 'com.amazon.firetv.youtube',
  netflix: 'com.netflix.ninja',
  prime:   'com.amazon.avod.thirdpartyclient',
  disney:  'com.disney.disneyplus',
  hulu:    'com.hulu.plus',
  apple:   'com.apple.atve.amazon.appletv',
};

const DIAL_APP_NAMES: Record<string, string> = {
  netflix: 'Netflix',
  prime:   'AmazonVideo',
  youtube: 'YouTube',
  disney:  'DisneyPlus',
  hulu:    'Hulu',
  apple:   'AppleTVPlus',
};

export default router;
