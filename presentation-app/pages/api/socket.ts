import { NextApiRequest } from 'next';
import { NextApiResponseWithSocket, initSocket } from '@/lib/socket';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (res.socket.server.io) {
    console.log('Socket.io already initialized');
  } else {
    initSocket(res);
  }

  res.end();
}
