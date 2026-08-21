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
  const generated = z.toJSONSchema(schema, { target: 'draft-7', unrepresentable: 'any' }) as Record<
    string,
    unknown
  >;

  return collapseNullableUnions(generated) as Record<string, unknown>;
}

// O Zod expressa `.nullable()` como `anyOf: [{type: X}, {type: 'null'}]`. O Ajv
// do Fastify coage tipos e, ao testar a primeira alternativa, converte `null`
// em `""` — o valor chega mutilado ao handler. Declarando `type: [X, 'null']`
// o `null` ja casa com um tipo aceito e nada e coagido.
function collapseNullableUnions(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(collapseNullableUnions);
  }
  if (node === null || typeof node !== 'object') {
    return node;
  }

  const entries = Object.entries(node as Record<string, unknown>).map(([key, value]) => [
    key,
    collapseNullableUnions(value),
  ]);
  const collapsed = Object.fromEntries(entries) as Record<string, unknown>;
  const nullable = asNullableUnion(collapsed.anyOf);

  if (!nullable) {
    return collapsed;
  }

  const { anyOf: _discarded, ...rest } = collapsed;
  return { ...nullable, ...rest };
}

function asNullableUnion(anyOf: unknown): Record<string, unknown> | null {
  if (!Array.isArray(anyOf) || anyOf.length !== 2) {
    return null;
  }

  const branches = anyOf as Record<string, unknown>[];
  const nullBranch = branches.find((branch) => branch?.type === 'null');
  const valueBranch = branches.find((branch) => branch?.type !== 'null');

  if (!nullBranch || !valueBranch || Object.keys(nullBranch).length !== 1) {
    return null;
  }
  if (typeof valueBranch.type !== 'string') {
    return null;
  }

  return { ...valueBranch, type: [valueBranch.type, 'null'] };
}
