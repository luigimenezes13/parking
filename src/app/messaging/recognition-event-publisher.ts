import { type RecognitionEventPayload } from '@app/messaging/recognition-event-payload.ts';

export interface RecognitionEventPublisher {
  publish(payload: RecognitionEventPayload): Promise<void>;
}
