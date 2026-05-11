import { type FastifyInstance } from 'fastify';

import { DomainError } from '@domain/shared/errors/domain-error.ts';
import { ActiveSessionNotFoundError } from '@app/exceptions/recognition/active-session-not-found-error.ts';
import { InvalidRecognitionPlateError } from '@app/exceptions/recognition/invalid-recognition-plate-error.ts';
import { ParkingSpotNotFoundError } from '@app/exceptions/recognition/parking-spot-not-found-error.ts';
import { HttpException } from '@infra/http/http-exception.ts';

export function registerErrorHandler(server: FastifyInstance): void {
  server.setErrorHandler((rawError, request, reply) => {
    const error = rawError instanceof Error ? rawError : new Error(String(rawError));

    if (error instanceof HttpException) {
      request.log.error(
        {
          err: error,
          url: request.url,
          method: request.method,
          status: error.statusCode,
        },
        'request.error',
      );
      return reply.status(error.statusCode).send({
        error: error.name,
        message: error.message,
        details: error.errors,
      });
    }

    const fastifyStatus = (error as { statusCode?: number }).statusCode;
    if (typeof fastifyStatus === 'number' && fastifyStatus >= 400 && fastifyStatus < 500) {
      request.log.error(
        {
          err: error,
          url: request.url,
          method: request.method,
          status: fastifyStatus,
        },
        'request.error',
      );
      return reply.status(fastifyStatus).send({
        error: error.name,
        message: error.message,
      });
    }

    const status = mapStatus(error);

    request.log.error(
      {
        err: error,
        url: request.url,
        method: request.method,
        status,
      },
      'request.error',
    );

    return reply.status(status).send({
      error: error.name,
      message: error.message,
    });
  });
}

function mapStatus(error: Error): number {
  if (error instanceof InvalidRecognitionPlateError) {
    return 400;
  }
  if (error instanceof ActiveSessionNotFoundError || error instanceof ParkingSpotNotFoundError) {
    return 404;
  }
  if (error.name.startsWith('Invalid')) {
    return 400;
  }
  if (error.name.endsWith('NotFoundError')) {
    return 404;
  }
  if (error.name.startsWith('Duplicate')) {
    return 409;
  }
  if (error.name.includes('HasActive')) {
    return 409;
  }
  if (error instanceof DomainError) {
    return 422;
  }
  return 500;
}
