export interface VehicleEnteredEventPayload {
  event: 'vehicle.entered';
  plate: string | null;
  timestamp: string;
}

export interface SpotOccupiedEventPayload {
  event: 'spot.occupied';
  spot_id: string;
  plate: string | null;
  confidence: number;
  timestamp: string;
}

export interface SpotReleasedEventPayload {
  event: 'spot.released';
  spot_id: string;
  plate: string | null;
  timestamp: string;
}

export interface VehicleExitedEventPayload {
  event: 'vehicle.exited';
  plate: string | null;
  timestamp: string;
}

export type RecognitionEventPayload =
  | VehicleEnteredEventPayload
  | SpotOccupiedEventPayload
  | SpotReleasedEventPayload
  | VehicleExitedEventPayload;

export type RecognitionEventType = RecognitionEventPayload['event'];

export const RECOGNITION_EVENT_TYPES: readonly RecognitionEventType[] = [
  'vehicle.entered',
  'spot.occupied',
  'spot.released',
  'vehicle.exited',
] as const;
