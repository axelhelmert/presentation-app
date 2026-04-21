'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RemoteHome() {
  const [sessionId, setSessionId] = useState('');
  const router = useRouter();

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionId.trim()) {
      router.push(`/remote/${sessionId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Präsentations-Fernsteuerung</h1>
          <p className="text-gray-400">
            Geben Sie die Session-ID ein, um eine Präsentation zu steuern
          </p>
        </div>

        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label htmlFor="sessionId" className="block text-sm font-medium mb-2">
              Session-ID
            </label>
            <input
              type="text"
              id="sessionId"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="pres-1234567890-abc123xyz"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Verbinden
          </button>
        </form>

        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-lg">So funktioniert's:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
            <li>Starten Sie eine Präsentation auf Ihrem Computer</li>
            <li>Klicken Sie auf die Schaltfläche "📱 Remote"</li>
            <li>
              Kopieren Sie die angezeigte URL oder Session-ID und öffnen Sie sie
              auf diesem Gerät
            </li>
            <li>Steuern Sie die Präsentation von hier aus</li>
          </ol>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>
            Beide Geräte müssen im gleichen Netzwerk sein oder der Server muss
            öffentlich zugänglich sein.
          </p>
        </div>
      </div>
    </div>
  );
}
