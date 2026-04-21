import { NextApiRequest, NextApiResponse } from 'next';
import { networkInterfaces } from 'os';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get local network IP address
  const nets = networkInterfaces();
  let localIp = 'localhost';

  for (const name of Object.keys(nets)) {
    const netInfo = nets[name];
    if (!netInfo) continue;

    for (const net of netInfo) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        localIp = net.address;
        break;
      }
    }
    if (localIp !== 'localhost') break;
  }

  res.status(200).json({
    ip: localIp,
    host: req.headers.host || `${localIp}:3000`,
  });
}
