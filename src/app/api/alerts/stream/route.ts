import { type Alert, type AlertType, type MitreTactic } from '@/lib/types';
import { logEmitter } from '@/lib/log-emitter';

// This endpoint is now driven by events from the log generator
export async function GET() {
  const abortController = new AbortController();
  const stream = new ReadableStream({
    start(controller) {
      const handler = (alert: Alert) => {
        const data = `data: ${JSON.stringify(alert)}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      };

      logEmitter.on('alert', handler);

      // Clean up the listener when the client closes the connection
      abortController.signal.addEventListener('abort', () => {
        logEmitter.off('alert', handler);
        controller.close();
      });
    },
    cancel() {
      abortController.abort();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// This is required to enable streaming responses on Vercel
export const dynamic = 'force-dynamic';
