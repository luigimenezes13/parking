import { type ChannelModel, connect } from 'amqplib';

import { loadEnvironment } from '@infra/env/environment.ts';

let cachedConnection: ChannelModel | null = null;

export async function getRabbitMQConnection(): Promise<ChannelModel> {
  if (cachedConnection) {
    return cachedConnection;
  }

  const environment = loadEnvironment();
  const connection = await connect(environment.RABBITMQ_URL);

  connection.on('close', () => {
    cachedConnection = null;
  });

  connection.on('error', () => {
    cachedConnection = null;
  });

  cachedConnection = connection;
  return connection;
}

export async function closeRabbitMQConnection(): Promise<void> {
  if (cachedConnection) {
    const current = cachedConnection;
    cachedConnection = null;
    await current.close();
  }
}
