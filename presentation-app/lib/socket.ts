import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export interface SlideUpdatePayload {
  slideIndex: number;
  totalSlides: number;
  sessionId: string;
}

export interface RemoteCommandPayload {
  command: 'next' | 'prev' | 'goto' | 'first' | 'last';
  slideIndex?: number;
  sessionId: string;
}

export const initSocket = (res: NextApiResponseWithSocket): SocketIOServer => {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...');

    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      transports: ['polling', 'websocket'],
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: false,
      },
      allowEIO3: true,
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join-session', (sessionId: string) => {
        console.log(`Socket ${socket.id} joining session: ${sessionId}`);
        socket.join(sessionId);
      });

      socket.on('leave-session', (sessionId: string) => {
        console.log(`Socket ${socket.id} leaving session: ${sessionId}`);
        socket.leave(sessionId);
      });

      socket.on('slide-update', (data: SlideUpdatePayload) => {
        console.log(`Slide update in session ${data.sessionId}: ${data.slideIndex}`);
        socket.to(data.sessionId).emit('slide-update', data);
      });

      socket.on('remote-command', (data: RemoteCommandPayload) => {
        console.log(`Remote command in session ${data.sessionId}: ${data.command}`);
        socket.to(data.sessionId).emit('remote-command', data);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  }

  return res.socket.server.io;
};
