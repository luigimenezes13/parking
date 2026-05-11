import { z } from 'zod/v4';

import { type ResponseSchemas } from './decorators/api-response-schema.ts';
import { type ApiOperationMetadata } from './decorators/api-operation.ts';

export interface OpenApiBuildInput {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
  responses?: ResponseSchemas;
  operation?: ApiOperationMetadata;
  tags?: string[];
}

export function buildOpenApiSchema(input: OpenApiBuildInput): Record<string, unknown> {
  const schema: Record<string, unknown> = {};

  if (input.operation?.summary) {
    schema.summary = input.operation.summary;
  }
  if (input.operation?.description) {
    schema.description = input.operation.description;
  }
  if (input.tags && input.tags.length > 0) {
    schema.tags = input.tags;
  }

  if (input.body) {
    schema.body = toJsonSchema(input.body);
  }
  if (input.params) {
    schema.params = toJsonSchema(input.params);
  }
  if (input.query) {
    schema.querystring = toJsonSchema(input.query);
  }
  if (input.responses) {
    const response: Record<string, unknown> = {};
    for (const [code, zodSchema] of Object.entries(input.responses)) {
      response[code] = toJsonSchema(zodSchema);
    }
    schema.response = response;
  }

  return schema;
}

function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
  return z.toJSONSchema(schema, { target: 'openapi-3.0', unrepresentable: 'any' }) as Record<
    string,
    unknown
  >;
}
