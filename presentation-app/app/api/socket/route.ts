import { NextRequest } from 'next/server';

// This is a placeholder route for Socket.io
// The actual Socket.io server is initialized in pages/api/socket.ts
export async function GET(request: NextRequest) {
  return new Response('Socket.IO endpoint - use pages/api/socket instead', {
    status: 200,
  });
}
