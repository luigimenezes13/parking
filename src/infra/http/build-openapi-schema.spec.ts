import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';

import { buildOpenApiSchema } from '@infra/http/build-openapi-schema.ts';

function bodyOf(schema: z.ZodType): Record<string, unknown> {
  const built = buildOpenApiSchema({ body: schema }) as {
    body: { properties: Record<string, Record<string, unknown>> };
  };
  return built.body.properties;
}

describe('buildOpenApiSchema', () => {
  it('declares a nullable field as a type union instead of anyOf', () => {
    // Com `anyOf`, o Ajv do Fastify coage `null` para "" ao testar a primeira
    // alternativa, e o handler recebe uma placa vazia que o dominio recusa.
    const properties = bodyOf(z.object({ plate: z.string().nullable() }));

    expect(properties.plate).toEqual({ type: ['string', 'null'] });
  });

  it('keeps the validations of the non-null branch', () => {
    const properties = bodyOf(z.object({ plate: z.string().min(7).nullable() }));

    expect(properties.plate).toMatchObject({ type: ['string', 'null'], minLength: 7 });
  });

  it('collapses nullable fields of other primitive types', () => {
    const properties = bodyOf(z.object({ confidence: z.number().nullable() }));

    expect(properties.confidence).toEqual({ type: ['number', 'null'] });
  });

  it('leaves a plain required field untouched', () => {
    const properties = bodyOf(z.object({ spotId: z.string() }));

    expect(properties.spotId).toEqual({ type: 'string' });
  });

  it('leaves a real union of two value types untouched', () => {
    const properties = bodyOf(z.object({ value: z.union([z.string(), z.number()]) }));

    expect(properties.value).toEqual({ anyOf: [{ type: 'string' }, { type: 'number' }] });
  });

  it('collapses nullable fields nested inside objects', () => {
    const properties = bodyOf(z.object({ vehicle: z.object({ plate: z.string().nullable() }) }));
    const vehicle = properties.vehicle as { properties: Record<string, unknown> };

    expect(vehicle.properties.plate).toEqual({ type: ['string', 'null'] });
  });
});
