import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { SlideUpdatePayload, RemoteCommandPayload } from '@/lib/socket';

export interface UseRemoteControlOptions {
  sessionId: string;
  onRemoteCommand?: (command: RemoteCommandPayload) => void;
}

export function useRemoteControl({
  sessionId,
  onRemoteCommand,
}: UseRemoteControlOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Build the Socket.io connection URL explicitly
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:';
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
    const socketUrl = `${protocol}//${host}`;

    let socket: Socket | null = null;
    let cancelled = false;

    // The socket server is lazily initialized by the /api/socket route —
    // connecting before that fetch completes loses the handshake race
    // ("server error" connect_error on first use), so await it first.
    const connect = async () => {
      try {
        await fetch('/api/socket');
      } catch (error) {
        console.error('Socket server initialization failed:', error);
      }
      if (cancelled) return;

      console.log('Presentation connecting to Socket.io server:', socketUrl);

      socket = io(socketUrl, {
        path: '/api/socket',
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Presentation socket connected, ID:', socket?.id);
        setIsConnected(true);
        socket?.emit('join-session', sessionId);
      });

      socket.on('connect_error', (error) => {
        console.error('Presentation socket connection error:', error);
        setIsConnected(false);
      });

      socket.on('disconnect', (reason) => {
        console.log('Presentation socket disconnected, reason:', reason);
        setIsConnected(false);
      });

      socket.on('remote-command', (data: RemoteCommandPayload) => {
        console.log('Received remote command:', data);
        if (data.sessionId === sessionId && onRemoteCommand) {
          onRemoteCommand(data);
        }
      });
    };

    connect();

    return () => {
      cancelled = true;
      if (socket) {
        socket.emit('leave-session', sessionId);
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [sessionId, onRemoteCommand]);

  const broadcastSlideUpdate = useCallback(
    (slideIndex: number, totalSlides: number) => {
      if (socketRef.current?.connected) {
        const payload: SlideUpdatePayload = {
          slideIndex,
          totalSlides,
          sessionId,
        };
        socketRef.current.emit('slide-update', payload);
      }
    },
    [sessionId]
  );

  const sendCommand = useCallback(
    (command: RemoteCommandPayload['command'], slideIndex?: number) => {
      if (socketRef.current?.connected) {
        const payload: RemoteCommandPayload = {
          command,
          slideIndex,
          sessionId,
        };
        socketRef.current.emit('remote-command', payload);
      }
    },
    [sessionId]
  );

  return {
    isConnected,
    broadcastSlideUpdate,
    sendCommand,
  };
}
