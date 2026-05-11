import { type z } from 'zod/v4';

export interface HttpExceptionDetail {
  code: string;
  message: string;
  path?: PropertyKey[];
}

export class HttpException extends Error {
  readonly statusCode: number;
  readonly errors: HttpExceptionDetail[];

  constructor(errors: HttpExceptionDetail[], statusCode: number) {
    super(errors[0]?.message ?? 'HttpException');
    this.name = 'HttpException';
    this.statusCode = statusCode;
    this.errors = errors;
  }

  static fromZod(error: z.ZodError): HttpExceptionDetail[] {
    return error.issues.map((issue) => ({
      code: issue.code,
      message: issue.message,
      path: issue.path,
    }));
  }
}

export class BadRequestException extends HttpException {
  constructor(errors: HttpExceptionDetail[]) {
    super(errors, 400);
    this.name = 'BadRequestException';
  }
}

export class NotFoundException extends HttpException {
  constructor(errors: HttpExceptionDetail[]) {
    super(errors, 404);
    this.name = 'NotFoundException';
  }
}

export class ConflictException extends HttpException {
  constructor(errors: HttpExceptionDetail[]) {
    super(errors, 409);
    this.name = 'ConflictException';
  }
}

export class UnprocessableEntityException extends HttpException {
  constructor(errors: HttpExceptionDetail[]) {
    super(errors, 422);
    this.name = 'UnprocessableEntityException';
  }
}
