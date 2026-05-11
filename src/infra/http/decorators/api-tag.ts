import 'reflect-metadata';

import { METADATA_KEYS } from '../metadata-keys.ts';

export function ApiTag(tag: string) {
  return function (target: object, propertyKey: string, _descriptor: PropertyDescriptor): void {
    const existing: string[] =
      (Reflect.getMetadata(METADATA_KEYS.TAGS, target, propertyKey) as string[] | undefined) ?? [];
    if (!existing.includes(tag)) {
      existing.push(tag);
    }
    Reflect.defineMetadata(METADATA_KEYS.TAGS, existing, target, propertyKey);
  };
}
