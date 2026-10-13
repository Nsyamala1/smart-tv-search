import net from 'net';
import os from 'os';
import { isPrivateIPv4 } from '../lib/security';
import type { TVDevice } from './dial';

const ADB_PORT = 5555;

/** True if something accepts a TCP connection on host:port within timeoutMs. */
function portOpen(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

/** Home-network IPv4 addresses of this machine's active interfaces. */
export function localAddresses(): string[] {
  const out: string[] = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const i of list ?? []) {
      if (i.family === 'IPv4' && !i.internal && isPrivateIPv4(i.address)) out.push(i.address);
    }
  }
  return out;
}

/**
 * Looks for devices on this machine's own network that accept the ADB port
 * (5555). Fire TV and Android/Google TV listen there once ADB debugging is on.
 * Only the /24 around each home-network address is probed, with short timeouts
 * and a cap on parallel connections.
 *
 * These are candidates: the name is filled in when the user picks one and the
 * backend actually connects (which is also when the TV shows its
 * "Allow USB debugging?" prompt).
 */
export async function scanForAdbDevices(
  addresses: string[] = localAddresses(),
  opts: { port?: number; timeoutMs?: number; concurrency?: number } = {}
): Promise<TVDevice[]> {
  const port = opts.port ?? ADB_PORT;
  const timeoutMs = opts.timeoutMs ?? 700;
  const concurrency = opts.concurrency ?? 64;

  const hosts: string[] = [];
  for (const self of addresses) {
    const base = self.split('.').slice(0, 3).join('.');
    for (let n = 1; n <= 254; n++) {
      const ip = `${base}.${n}`;
      if (ip !== self && !hosts.includes(ip)) hosts.push(ip);
    }
  }

  const found: string[] = [];
  let next = 0;
  async function worker() {
    while (next < hosts.length) {
      const ip = hosts[next++];
      if (await portOpen(ip, port, timeoutMs)) found.push(ip);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, hosts.length) }, worker));

  return found
    .sort((a, b) => a.split('.').map(Number).reduce((x, y) => x * 256 + y) -
                    b.split('.').map(Number).reduce((x, y) => x * 256 + y))
    .map((ip) => ({
      id: `adb-${ip}`,
      friendlyName: 'Android / Fire TV',
      manufacturer: 'ADB debugging on',
      ip,
      dialUrl: `http://${ip}:60000/apps`,
      platform: 'android-tv' as const,
    }));
}
