export const METADATA_KEYS = {
  ROUTES: Symbol.for('parking:http:routes'),
  BODY_SCHEMA: Symbol.for('parking:http:body-schema'),
  PARAMS_SCHEMA: Symbol.for('parking:http:params-schema'),
  QUERY_SCHEMA: Symbol.for('parking:http:query-schema'),
  RESPONSE_SCHEMAS: Symbol.for('parking:http:response-schemas'),
  OPERATION: Symbol.for('parking:http:operation'),
  TAGS: Symbol.for('parking:http:tags'),
} as const;
