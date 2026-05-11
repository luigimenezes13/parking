import 'reflect-metadata';
import { type z } from 'zod/v4';

import { METADATA_KEYS } from '../metadata-keys.ts';

export function ApiParamsSchema(schema: z.ZodType) {
  return function (target: object, propertyKey: string, _descriptor: PropertyDescriptor): void {
    Reflect.defineMetadata(METADATA_KEYS.PARAMS_SCHEMA, schema, target, propertyKey);
  };
}
