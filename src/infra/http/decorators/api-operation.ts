import 'reflect-metadata';

import { METADATA_KEYS } from '../metadata-keys.ts';

export interface ApiOperationMetadata {
  summary: string;
  description?: string;
}

export function ApiOperation(summary: string, description?: string) {
  return function (target: object, propertyKey: string, _descriptor: PropertyDescriptor): void {
    const metadata: ApiOperationMetadata = { summary };
    if (description) {
      metadata.description = description;
    }
    Reflect.defineMetadata(METADATA_KEYS.OPERATION, metadata, target, propertyKey);
  };
}
