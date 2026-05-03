import { type Channel, type ConsumeMessage } from 'amqplib';

import { type RecognitionEventPayload } from '@app/messaging/recognition-event-payload.ts';

const MAX_RETRIES = 3;

export type RecognitionEventHandler = (payload: RecognitionEventPayload) => Promise<void>;

export interface RecognitionConsumerBinding {
  queue: string;
  handler: RecognitionEventHandler;
}

export async function startRecognitionConsumers(
  channel: Channel,
  bindings: ReadonlyArray<RecognitionConsumerBinding>,
  prefetch: number,
): Promise<void> {
  await channel.prefetch(prefetch);

  for (const binding of bindings) {
    await channel.consume(binding.queue, async (message) => {
      if (!message) return;

      try {
        const payload = parsePayload(message);
        await binding.handler(payload);
        channel.ack(message);
      } catch (error) {
        const attempts = readAttempts(message) + 1;

        if (attempts >= MAX_RETRIES) {
          // Send to DLQ via dead-letter exchange (configured at queue level).
          channel.nack(message, false, false);
          logFailure(binding.queue, attempts, error, true);
        } else {
          channel.nack(message, false, false);
          logFailure(binding.queue, attempts, error, false);
        }
      }
    });
  }
}

function parsePayload(message: ConsumeMessage): RecognitionEventPayload {
  return JSON.parse(message.content.toString('utf8')) as RecognitionEventPayload;
}

function readAttempts(message: ConsumeMessage): number {
  const headers = message.properties.headers ?? {};
  const death = headers['x-death'];
  if (Array.isArray(death) && death[0] && typeof death[0] === 'object' && 'count' in death[0]) {
    const count = (death[0] as { count?: number }).count;
    return typeof count === 'number' ? count : 0;
  }
  return 0;
}

function logFailure(queue: string, attempt: number, error: unknown, dropped: boolean): void {
  const reason = error instanceof Error ? error.message : String(error);
  console.error(
    JSON.stringify({
      level: 'error',
      message: 'recognition-event-consumer.failed',
      queue,
      attempt,
      dropped,
      reason,
    }),
  );
}
