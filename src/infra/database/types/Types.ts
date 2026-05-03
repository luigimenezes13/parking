import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

import type { SpotStatus, SessionStatus } from "./Enums.ts";

export type Driver = {
    id: string;
    cnh: string;
    name: string;
    email: string;
    phone: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type ParkingLot = {
    id: string;
    name: string;
    address: string;
    total_capacity: number;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type ParkingSession = {
    id: string;
    parking_lot_id: string;
    vehicle_id: string | null;
    spot_id: string | null;
    status: Generated<SessionStatus>;
    entry_at: Timestamp;
    spot_released_at: Timestamp | null;
    exit_at: Timestamp | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type ParkingSpot = {
    id: string;
    parking_lot_id: string;
    code: string;
    floor: number;
    is_covered: boolean;
    status: Generated<SpotStatus>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Vehicle = {
    id: string;
    driver_id: string | null;
    parking_lot_id: string;
    license_plate: string;
    brand: string | null;
    model: string | null;
    color: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type DB = {
    drivers: Driver;
    parking_lots: ParkingLot;
    parking_sessions: ParkingSession;
    parking_spots: ParkingSpot;
    vehicles: Vehicle;
};
