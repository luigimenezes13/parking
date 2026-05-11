import 'reflect-metadata';
import { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { type z } from 'zod/v4';

import { METADATA_KEYS } from './metadata-keys.ts';
import { type RouteDefinition } from './decorators/route.ts';
import { type ResponseSchemas } from './decorators/api-response-schema.ts';
import { type ApiOperationMetadata } from './decorators/api-operation.ts';
import { buildOpenApiSchema } from './build-openapi-schema.ts';

type Handler = (request: FastifyRequest, reply: FastifyReply) => Promise<unknown> | unknown;

export function RegisterController(server: FastifyInstance, instance: object): void {
  const constructor = instance.constructor;
  const prototype = Object.getPrototypeOf(instance) as object;

  const routes =
    (Reflect.getMetadata(METADATA_KEYS.ROUTES, constructor) as RouteDefinition[] | undefined) ?? [];

  for (const route of routes) {
    const propertyKey = route.propertyKey;

    const bodySchema = Reflect.getMetadata(METADATA_KEYS.BODY_SCHEMA, prototype, propertyKey) as
      | z.ZodType
      | undefined;
    const paramsSchema = Reflect.getMetadata(
      METADATA_KEYS.PARAMS_SCHEMA,
      prototype,
      propertyKey,
    ) as z.ZodType | undefined;
    const querySchema = Reflect.getMetadata(METADATA_KEYS.QUERY_SCHEMA, prototype, propertyKey) as
      | z.ZodType
      | undefined;
    const responses = Reflect.getMetadata(
      METADATA_KEYS.RESPONSE_SCHEMAS,
      prototype,
      propertyKey,
    ) as ResponseSchemas | undefined;
    const operation = Reflect.getMetadata(METADATA_KEYS.OPERATION, prototype, propertyKey) as
      | ApiOperationMetadata
      | undefined;
    const tags = Reflect.getMetadata(METADATA_KEYS.TAGS, prototype, propertyKey) as
      | string[]
      | undefined;

    const schema = buildOpenApiSchema({
      body: bodySchema,
      params: paramsSchema,
      query: querySchema,
      responses,
      operation,
      tags,
    });

    const handler = (instance as Record<string, Handler>)[propertyKey].bind(instance);

    server.route({
      method: route.method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      url: route.path,
      schema,
      handler,
    });
  }
}
