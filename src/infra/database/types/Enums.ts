export const SpotStatus = {
  FREE: 'FREE',
  OCCUPIED: 'OCCUPIED',
  RESERVED: 'RESERVED',
} as const;
export type SpotStatus = (typeof SpotStatus)[keyof typeof SpotStatus];
export const SessionStatus = {
  ACTIVE: 'ACTIVE',
  FINISHED: 'FINISHED',
} as const;
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];
