import { type z } from 'zod/v4';

import { BadRequestException, HttpException } from './http-exception.ts';

export abstract class RequestDto<T> {
  private readonly _props: T;

  constructor(props: T, schema: z.ZodType) {
    const result = schema.safeParse(props);
    if (!result.success) {
      throw new BadRequestException(HttpException.fromZod(result.error));
    }
    this._props = { ...props, ...(result.data as Partial<T>) };
  }

  get props(): T {
    return this._props;
  }
}
