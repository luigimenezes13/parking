import 'reflect-metadata';
import { type z } from 'zod/v4';

import { METADATA_KEYS } from '../metadata-keys.ts';

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export interface RouteDefinition {
  propertyKey: string;
  method: HttpMethod;
  path: string;
}

export function Route(method: HttpMethod, path: string, bodySchema?: z.ZodType) {
  return function (target: object, propertyKey: string, _descriptor: PropertyDescriptor): void {
    const constructor = target.constructor;
    const existing: RouteDefinition[] =
      (Reflect.getMetadata(METADATA_KEYS.ROUTES, constructor) as RouteDefinition[] | undefined) ??
      [];
    existing.push({ propertyKey, method, path });
    Reflect.defineMetadata(METADATA_KEYS.ROUTES, existing, constructor);

    if (bodySchema) {
      Reflect.defineMetadata(METADATA_KEYS.BODY_SCHEMA, bodySchema, target, propertyKey);
    }
  };
}
