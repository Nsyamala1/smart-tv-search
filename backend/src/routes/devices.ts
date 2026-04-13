import { Router, Request, Response } from 'express';
import axios from 'axios';
import { discoverDialDevices, TVDevice } from '../services/dial';

const router = Router();

// GET /devices/discover — SSDP scan for DIAL devices on local network
router.get('/discover', async (_req: Request, res: Response) => {
  try {
    const devices = await discoverDialDevices(5000);
    res.json({ devices });
  } catch (err) {
    console.error('Discovery error:', err);
    res.status(500).json({ error: 'Discovery failed' });
  }
});

// POST /devices/launch — launch content on a TV
router.post('/launch', async (req: Request, res: Response) => {
  const { device, content } = req.body as {
    device: TVDevice;
    content: {
      service: string;
      deepLinkUrl?: string;
      searchQuery: string;
      title: string;
    };
  };

  if (!device || !content) {
    res.status(400).json({ error: 'device and content are required' });
    return;
  }

  try {
    if (device.platform === 'android-tv' && content.deepLinkUrl) {
      await launchAndroidTV(device, content.deepLinkUrl);
    } else {
      await launchViaDial(device, content.service, content.searchQuery);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Launch error:', err);
    res.status(500).json({ error: 'Launch failed' });
  }
});

/**
 * Android TV: fire an intent via ADB shell or DIAL with content URI.
 * If ADB is not enabled, falls back to DIAL app launch.
 */
async function launchAndroidTV(device: TVDevice, deepLinkUrl: string) {
  const service = deepLinkUrl.includes('netflix') ? 'Netflix'
    : deepLinkUrl.includes('amazon') ? 'AmazonVideo'
    : deepLinkUrl.includes('youtube') ? 'YouTube'
    : null;

  if (service) {
    await launchDialApp(device.dialUrl, service, deepLinkUrl);
  }
}

/**
 * Launch app via DIAL protocol (works on most smart TV platforms).
 * POST to the DIAL apps endpoint to start an app.
 */
async function launchViaDial(device: TVDevice, service: string, searchQuery: string) {
  const appName = DIAL_APP_NAMES[service] ?? service;
  await launchDialApp(device.dialUrl, appName, undefined, searchQuery);
}

async function launchDialApp(
  dialUrl: string,
  appName: string,
  contentUrl?: string,
  searchQuery?: string
) {
  const body = contentUrl
    ? `v=${encodeURIComponent(contentUrl)}`
    : searchQuery
    ? `query=${encodeURIComponent(searchQuery)}`
    : '';

  await axios.post(`${dialUrl}/${appName}`, body, {
    headers: { 'Content-Type': 'text/plain' },
    timeout: 5000,
  });
}

const DIAL_APP_NAMES: Record<string, string> = {
  netflix: 'Netflix',
  prime: 'AmazonVideo',
  youtube: 'YouTube',
  disney: 'DisneyPlus',
  hulu: 'Hulu',
  apple: 'AppleTVPlus',
};

export default router;
