export const SpotStatus = {
    FREE: "FREE",
    OCCUPIED: "OCCUPIED",
    RESERVED: "RESERVED"
} as const;
export type SpotStatus = (typeof SpotStatus)[keyof typeof SpotStatus];
export const SessionStatus = {
    ACTIVE: "ACTIVE",
    FINISHED: "FINISHED"
} as const;
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];
export const SpotType = {
    REGULAR: "REGULAR",
    COMPACT: "COMPACT",
    LARGE: "LARGE",
    MOTORCYCLE: "MOTORCYCLE",
    ACCESSIBLE: "ACCESSIBLE",
    ELECTRIC: "ELECTRIC"
} as const;
export type SpotType = (typeof SpotType)[keyof typeof SpotType];
