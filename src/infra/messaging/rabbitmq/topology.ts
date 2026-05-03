import { type Channel } from 'amqplib';

import { RECOGNITION_EVENT_TYPES } from '@app/messaging/recognition-event-payload.ts';

export interface RecognitionTopology {
  exchange: string;
  dlxExchange: string;
  queues: ReadonlyArray<{
    routingKey: string;
    queue: string;
    deadLetterQueue: string;
  }>;
}

export function buildRecognitionTopology(exchangeName: string): RecognitionTopology {
  const dlxExchange = `${exchangeName}.dlx`;

  return {
    exchange: exchangeName,
    dlxExchange,
    queues: RECOGNITION_EVENT_TYPES.map((eventType) => ({
      routingKey: eventType,
      queue: `q.recognition.${eventType}`,
      deadLetterQueue: `q.recognition.${eventType}.dlq`,
    })),
  };
}

export async function declareRecognitionTopology(
  channel: Channel,
  topology: RecognitionTopology,
): Promise<void> {
  await channel.assertExchange(topology.exchange, 'topic', { durable: true });
  await channel.assertExchange(topology.dlxExchange, 'topic', { durable: true });

  for (const binding of topology.queues) {
    await channel.assertQueue(binding.deadLetterQueue, { durable: true });
    await channel.bindQueue(binding.deadLetterQueue, topology.dlxExchange, binding.routingKey);

    await channel.assertQueue(binding.queue, {
      durable: true,
      deadLetterExchange: topology.dlxExchange,
      deadLetterRoutingKey: binding.routingKey,
    });
    await channel.bindQueue(binding.queue, topology.exchange, binding.routingKey);
  }
}
