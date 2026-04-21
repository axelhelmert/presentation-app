'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { SlideUpdatePayload, RemoteCommandPayload } from '@/lib/socket';

interface RemoteControlProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default function RemoteControl({ params }: RemoteControlProps) {
  const { sessionId } = use(params);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLog((prev) => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    // Build the Socket.io connection URL explicitly
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const host = window.location.host;
    const socketUrl = `${protocol}//${host}`;

    addDebugLog(`Connecting to: ${socketUrl}`);
    console.log('Connecting to Socket.io server:', socketUrl);

    // Initialize Socket.io connection with explicit URL and options
    const newSocket = io(socketUrl, {
      path: '/api/socket',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    newSocket.on('connect', () => {
      addDebugLog(`Connected! Socket ID: ${newSocket.id}`);
      console.log('Remote control connected, socket ID:', newSocket.id);
      setIsConnected(true);
      newSocket.emit('join-session', sessionId);
    });

    newSocket.on('connect_error', (error) => {
      addDebugLog(`Connection error: ${error.message}`);
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      addDebugLog(`Disconnected: ${reason}`);
      console.log('Remote control disconnected, reason:', reason);
      setIsConnected(false);
    });

    newSocket.on('slide-update', (data: SlideUpdatePayload) => {
      addDebugLog(`Slide update: ${data.slideIndex + 1}/${data.totalSlides}`);
      console.log('Received slide update:', data);
      if (data.sessionId === sessionId) {
        setCurrentSlide(data.slideIndex);
        setTotalSlides(data.totalSlides);
      }
    });

    setSocket(newSocket);

    // Initialize the socket server
    fetch('/api/socket').catch((err) => {
      addDebugLog(`Fetch error: ${err.message}`);
      console.error(err);
    });

    return () => {
      newSocket.emit('leave-session', sessionId);
      newSocket.disconnect();
    };
  }, [sessionId]);

  const sendCommand = useCallback(
    (command: RemoteCommandPayload['command'], slideIndex?: number) => {
      if (socket?.connected) {
        const payload: RemoteCommandPayload = {
          command,
          slideIndex,
          sessionId,
        };
        socket.emit('remote-command', payload);
      }
    },
    [socket, sessionId]
  );

  const handlePrevious = () => sendCommand('prev');
  const handleNext = () => sendCommand('next');
  const handleFirst = () => sendCommand('first');
  const handleLast = () => sendCommand('last');

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Fernsteuerung</h1>
          <div className="flex items-center gap-2 text-sm">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-gray-300">
              {isConnected ? 'Verbunden' : 'Nicht verbunden'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-8">
          {/* Slide Counter */}
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="text-6xl font-bold mb-2">
              {totalSlides > 0 ? currentSlide + 1 : '—'}
            </div>
            <div className="text-2xl text-gray-400">
              von {totalSlides > 0 ? totalSlides : '—'}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handlePrevious}
              disabled={!isConnected || currentSlide === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 text-white font-bold py-8 px-6 rounded-lg text-2xl transition-colors"
            >
              ← Zurück
            </button>
            <button
              onClick={handleNext}
              disabled={!isConnected || currentSlide >= totalSlides - 1}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 text-white font-bold py-8 px-6 rounded-lg text-2xl transition-colors"
            >
              Weiter →
            </button>
          </div>

          {/* Quick Navigation */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleFirst}
              disabled={!isConnected}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
            >
              ⏮ Erste Folie
            </button>
            <button
              onClick={handleLast}
              disabled={!isConnected}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
            >
              Letzte Folie ⏭
            </button>
          </div>

          {/* Info */}
          {!isConnected && (
            <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4 text-center">
              <p className="text-yellow-200">
                Warte auf Verbindung zur Präsentation...
              </p>
              <p className="text-yellow-300 text-sm mt-2">
                Stellen Sie sicher, dass die Präsentation läuft und dass beide
                Geräte im gleichen Netzwerk sind.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 p-4 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-4">
          <p>Session: {sessionId}</p>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            {showDebug ? 'Debug ausblenden' : 'Debug anzeigen'}
          </button>
        </div>
      </div>

      {/* Debug panel */}
      {showDebug && (
        <div className="fixed bottom-20 left-4 right-4 bg-black bg-opacity-95 text-green-400 p-4 rounded-lg font-mono text-xs max-h-64 overflow-y-auto">
          <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
            <h3 className="font-bold text-white">Debug-Log</h3>
            <button
              onClick={() => setDebugLog([])}
              className="text-red-400 hover:text-red-300"
            >
              Clear
            </button>
          </div>
          {debugLog.length === 0 ? (
            <p className="text-gray-500">Keine Logs vorhanden</p>
          ) : (
            debugLog.map((log, i) => (
              <div key={i} className="py-1">
                {log}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
