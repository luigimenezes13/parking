import 'reflect-metadata';
import { type z } from 'zod/v4';

import { METADATA_KEYS } from '../metadata-keys.ts';

export type ResponseSchemas = Record<number, z.ZodType>;

export function ApiResponseSchema(schemas: ResponseSchemas) {
  return function (target: object, propertyKey: string, _descriptor: PropertyDescriptor): void {
    Reflect.defineMetadata(METADATA_KEYS.RESPONSE_SCHEMAS, schemas, target, propertyKey);
  };
}
