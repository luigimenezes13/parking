import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type ChannelModel, type Channel, connect } from 'amqplib';

import { type RecognitionEventPayload } from '@app/messaging/recognition-event-payload.ts';
import { RabbitMQRecognitionEventPublisher } from '@infra/messaging/rabbitmq/rabbitmq-recognition-event-publisher.ts';
import {
  buildRecognitionTopology,
  declareRecognitionTopology,
  type RecognitionTopology,
} from '@infra/messaging/rabbitmq/topology.ts';
import { startRecognitionConsumers } from '@infra/messaging/rabbitmq/recognition-event-consumer.ts';

const TEST_EXCHANGE = 'test.recognition.events';
const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';

interface Setup {
  connection: ChannelModel;
  channel: Channel;
  topology: RecognitionTopology;
  publisher: RabbitMQRecognitionEventPublisher;
}

async function makeSetup(): Promise<Setup> {
  const connection = await connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  const topology = buildRecognitionTopology(TEST_EXCHANGE);
  await declareRecognitionTopology(channel, topology);
  for (const binding of topology.queues) {
    await channel.purgeQueue(binding.queue).catch(() => undefined);
    await channel.purgeQueue(binding.deadLetterQueue).catch(() => undefined);
  }

  const publisher = new RabbitMQRecognitionEventPublisher(channel, topology);
  return { connection, channel, topology, publisher };
}

describe('Recognition flow end-to-end through RabbitMQ', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  afterEach(async () => {
    if (setup.channel) await setup.channel.close().catch(() => undefined);
    if (setup.connection) await setup.connection.close().catch(() => undefined);
  });

  it('should route a vehicle.entered payload to its dedicated queue and trigger the handler', async () => {
    const received: RecognitionEventPayload[] = [];
    const vehicleEnteredQueue = setup.topology.queues.find(
      (q) => q.routingKey === 'vehicle.entered',
    )!.queue;

    await startRecognitionConsumers(
      setup.channel,
      [
        {
          queue: vehicleEnteredQueue,
          handler: async (payload) => {
            received.push(payload);
          },
        },
      ],
      10,
    );

    await setup.publisher.publish({
      event: 'vehicle.entered',
      plate: 'ABC1D23',
      timestamp: new Date().toISOString(),
    });

    await waitFor(() => received.length === 1, 3000);

    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({ event: 'vehicle.entered', plate: 'ABC1D23' });
  });

  it('should route each event type to its matching queue', async () => {
    const received: Record<string, RecognitionEventPayload[]> = {
      'vehicle.entered': [],
      'spot.occupied': [],
      'spot.released': [],
      'vehicle.exited': [],
    };

    await startRecognitionConsumers(
      setup.channel,
      setup.topology.queues.map((binding) => ({
        queue: binding.queue,
        handler: async (payload) => {
          received[payload.event]?.push(payload);
        },
      })),
      10,
    );

    const timestamp = new Date().toISOString();

    await setup.publisher.publish({ event: 'vehicle.entered', plate: 'ABC1D23', timestamp });
    await setup.publisher.publish({
      event: 'spot.occupied',
      spot_id: 'A',
      plate: 'ABC1D23',
      confidence: 0.9,
      timestamp,
    });
    await setup.publisher.publish({
      event: 'spot.released',
      spot_id: 'A',
      plate: 'ABC1D23',
      timestamp,
    });
    await setup.publisher.publish({ event: 'vehicle.exited', plate: 'ABC1D23', timestamp });

    await waitFor(() => Object.values(received).every((bucket) => bucket.length === 1), 3000);

    expect(received['vehicle.entered']).toHaveLength(1);
    expect(received['spot.occupied']).toHaveLength(1);
    expect(received['spot.released']).toHaveLength(1);
    expect(received['vehicle.exited']).toHaveLength(1);
  });
});

async function waitFor(predicate: () => boolean, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`Timed out after ${timeoutMs}ms waiting for predicate`);
}
