import { type Alert } from '@/lib/types';
import { logEmitter } from '@/lib/log-emitter';

export async function GET() {
	const stream = new ReadableStream({
		start(controller) {
			console.log('[alerts/stream] New SSE client connected');
			const handler = (alert: Alert) => {
				try {
					const data = `data: ${JSON.stringify(alert)}\n\n`;
					controller.enqueue(new TextEncoder().encode(data));
					console.log('[alerts/stream] enqueued alert', alert.id, alert.alertType);
				} catch (err) {
					console.warn('Failed to enqueue alert to SSE controller:', err);
				}
			};

			logEmitter.on('alert', handler);

			// send an initial ready ping
			try {
				controller.enqueue(new TextEncoder().encode('data: {"ready":true}\n\n'));
			} catch (e) {}

			const onAbort = () => {
				try { logEmitter.off('alert', handler); } catch (e) {}
				try { controller.close(); } catch (e) {}
			};

			// close when client disconnects
			// controller.signal exists in runtime that supports it; guard access
			try {
				(controller as any).signal?.addEventListener?.('abort', onAbort);
			} catch (e) {
				// ignore
			}
		},
		cancel() {
			// called when the stream is cancelled client-side
			try { /* nothing special to do */ } catch (e) {}
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

export const dynamic = 'force-dynamic';

