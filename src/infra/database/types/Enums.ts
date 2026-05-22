export const SpotStatus = {
    FREE: "FREE",
    OCCUPIED: "OCCUPIED",
    RESERVED: "RESERVED",
    MAINTENANCE: "MAINTENANCE"
} as const;
export type SpotStatus = (typeof SpotStatus)[keyof typeof SpotStatus];
export const CameraStatus = {
    ONLINE: "ONLINE",
    OFFLINE: "OFFLINE",
    UNREGISTERED: "UNREGISTERED"
} as const;
export type CameraStatus = (typeof CameraStatus)[keyof typeof CameraStatus];
export const ActivityType = {
    VEHICLE_ENTERED: "VEHICLE_ENTERED",
    SPOT_OCCUPIED: "SPOT_OCCUPIED",
    SPOT_RELEASED: "SPOT_RELEASED",
    VEHICLE_EXITED: "VEHICLE_EXITED",
    SESSION_STARTED: "SESSION_STARTED",
    SESSION_FINISHED: "SESSION_FINISHED",
    MANUAL_FORCE_FINISH: "MANUAL_FORCE_FINISH",
    MANUAL_FORCE_PLATE: "MANUAL_FORCE_PLATE",
    SPOT_MAINTENANCE_ON: "SPOT_MAINTENANCE_ON",
    SPOT_MAINTENANCE_OFF: "SPOT_MAINTENANCE_OFF",
    CAMERA_ONLINE: "CAMERA_ONLINE",
    CAMERA_OFFLINE: "CAMERA_OFFLINE"
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];
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
