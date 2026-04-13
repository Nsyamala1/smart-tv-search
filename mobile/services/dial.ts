import axios from 'axios';
import { ContentResult } from './content';

export interface TVDevice {
  id: string;
  friendlyName: string;
  manufacturer: string;
  ip: string;
  dialUrl: string;
  platform: 'android-tv' | 'samsung' | 'lg' | 'roku' | 'fire-tv' | 'unknown';
}

// In-memory selected device — persists for the session
let selectedDevice: TVDevice | null = null;

export function getSelectedDevice(): TVDevice | null {
  return selectedDevice;
}

export function setSelectedDevice(device: TVDevice) {
  selectedDevice = device;
}

/**
 * Discover DIAL-compatible devices on the local network via SSDP.
 * We hit the backend to do the UDP broadcast (React Native UDP is limited).
 */
export async function discoverDevices(): Promise<TVDevice[]> {
  try {
    const { BACKEND_URL } = await import('./config');
    const response = await axios.get(`${BACKEND_URL}/devices/discover`, {
      timeout: 10000,
    });
    return response.data.devices;
  } catch {
    return [];
  }
}

/**
 * Launch content on the TV.
 * Strategy:
 *   1. Android TV — use Android intent deep link
 *   2. Others — launch the app via DIAL, then send search text
 */
export async function launchOnTV(device: TVDevice, content: ContentResult): Promise<void> {
  const { BACKEND_URL } = await import('./config');
  await axios.post(`${BACKEND_URL}/devices/launch`, {
    device,
    content,
  });
}
