import dgram from 'dgram';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

export interface TVDevice {
  id: string;
  friendlyName: string;
  manufacturer: string;
  ip: string;
  dialUrl: string;
  platform: 'android-tv' | 'samsung' | 'lg' | 'roku' | 'fire-tv' | 'unknown';
}

const SSDP_ADDRESS = '239.255.255.250';
const SSDP_PORT = 1900;
const SSDP_SEARCH = [
  'M-SEARCH * HTTP/1.1',
  `HOST: ${SSDP_ADDRESS}:${SSDP_PORT}`,
  'MAN: "ssdp:discover"',
  'MX: 3',
  'ST: urn:dial-multiscreen-org:service:dial:1',
  '',
  '',
].join('\r\n');

/**
 * Broadcasts an SSDP M-SEARCH on the local network and collects DIAL device responses.
 * Returns all devices that respond within the timeout window.
 */
export function discoverDialDevices(timeoutMs = 5000): Promise<TVDevice[]> {
  return new Promise((resolve) => {
    const socket = dgram.createSocket('udp4');
    const locationUrls: string[] = [];

    const seen = new Map<string, string>(); // location → application-url

    socket.on('message', (msg) => {
      const response = msg.toString();
      const locationMatch = response.match(/LOCATION:\s*(.+)/i);
      const appUrlMatch = response.match(/Application-URL:\s*(.+)/i);
      if (locationMatch) {
        const location = locationMatch[1].trim();
        const appUrl = appUrlMatch ? appUrlMatch[1].trim() : '';
        if (!seen.has(location)) seen.set(location, appUrl);
      }
    });

    socket.bind(() => {
      socket.setBroadcast(true);
      const buf = Buffer.from(SSDP_SEARCH);
      socket.send(buf, 0, buf.length, SSDP_PORT, SSDP_ADDRESS);
    });

    setTimeout(async () => {
      socket.close();
      const devices = await Promise.all(
        Array.from(seen.entries()).map(([loc, appUrl]) => fetchDeviceInfo(loc, appUrl))
      );
      resolve(devices.filter((d): d is TVDevice => d !== null));
    }, timeoutMs);
  });
}

async function fetchDeviceInfo(locationUrl: string, applicationUrl: string): Promise<TVDevice | null> {
  try {
    const response = await axios.get(locationUrl, { timeout: 3000 });
    const xml = await parseStringPromise(response.data);
    const device = xml?.root?.device?.[0];
    if (!device) return null;

    const ip = new URL(locationUrl).hostname;
    const manufacturer = device.manufacturer?.[0] ?? 'Unknown';
    const friendlyName = device.friendlyName?.[0] ?? 'Smart TV';
    const udn = device.UDN?.[0] ?? locationUrl;

    // Prefer the Application-URL from SSDP headers (authoritative DIAL endpoint)
    // Fall back to deriving it from the origin of the location URL
    const origin = `${new URL(locationUrl).protocol}//${new URL(locationUrl).host}`;
    const dialUrl = applicationUrl
      ? applicationUrl.replace(/\/$/, '')  // strip trailing slash
      : `${origin}/apps`;

    return {
      id: udn,
      friendlyName,
      manufacturer,
      ip,
      dialUrl,
      platform: detectPlatform(manufacturer, friendlyName),
    };
  } catch {
    return null;
  }
}

function detectPlatform(manufacturer: string, friendlyName: string): TVDevice['platform'] {
  const m = manufacturer.toLowerCase();
  const n = friendlyName.toLowerCase();
  if (m.includes('samsung')) return 'samsung';
  if (m.includes('lg')) return 'lg';
  if (m.includes('roku')) return 'roku';
  if (m.includes('amazon') || n.includes('fire')) return 'fire-tv';
  if (m.includes('google') || n.includes('android') || n.includes('chromecast')) return 'android-tv';
  return 'unknown';
}
