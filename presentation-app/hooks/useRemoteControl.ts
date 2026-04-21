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
    // Initialize Socket.io connection
    const socket = io({
      path: '/api/socket',
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      socket.emit('join-session', sessionId);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('remote-command', (data: RemoteCommandPayload) => {
      if (data.sessionId === sessionId && onRemoteCommand) {
        onRemoteCommand(data);
      }
    });

    // Initialize the socket server
    fetch('/api/socket').catch(console.error);

    return () => {
      socket.emit('leave-session', sessionId);
      socket.disconnect();
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
