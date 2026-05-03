import { type Channel } from 'amqplib';
import { inject, injectable } from 'inversify';

import { type RecognitionEventPayload } from '@app/messaging/recognition-event-payload.ts';
import { type RecognitionEventPublisher } from '@app/messaging/recognition-event-publisher.ts';
import { TYPES } from '@app/dto/types.ts';
import { type RecognitionTopology } from '@infra/messaging/rabbitmq/topology.ts';

export const RABBITMQ_TYPES = {
  Channel: Symbol('RabbitMQ.Channel'),
  Topology: Symbol('RabbitMQ.RecognitionTopology'),
} as const;

@injectable()
export class RabbitMQRecognitionEventPublisher implements RecognitionEventPublisher {
  private readonly channel: Channel;
  private readonly topology: RecognitionTopology;

  constructor(
    @inject(RABBITMQ_TYPES.Channel) channel: Channel,
    @inject(RABBITMQ_TYPES.Topology) topology: RecognitionTopology,
  ) {
    this.channel = channel;
    this.topology = topology;
  }

  async publish(payload: RecognitionEventPayload): Promise<void> {
    const buffer = Buffer.from(JSON.stringify(payload), 'utf8');

    const ok = this.channel.publish(this.topology.exchange, payload.event, buffer, {
      persistent: true,
      contentType: 'application/json',
    });

    if (!ok) {
      await new Promise<void>((resolve) => {
        this.channel.once('drain', resolve);
      });
    }
  }
}

// Avoid unused import warning when this symbol map is exported alongside the publisher.
void TYPES;
