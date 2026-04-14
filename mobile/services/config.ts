// localhost works in simulators; use your Mac's local IP for real devices
// Find your IP: System Settings → Wi-Fi → Details, or run: ipconfig getifaddr en0
const DEV_MACHINE_IP = '192.168.1.188'; // your Mac's local IP — phone must be on the same WiFi

export const BACKEND_URL = `http://${DEV_MACHINE_IP}:3001`;
