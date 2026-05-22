import { injectable } from 'inversify';

import { type ActivityEvent } from '@domain/activity/entities/activity-event.ts';

export type ActivityListener = (event: ActivityEvent) => void;

export interface ActivityBroadcaster {
  subscribe(parkingLotId: string, listener: ActivityListener): () => void;
  publish(parkingLotId: string, event: ActivityEvent): void;
}

@injectable()
export class InMemoryActivityBroadcaster implements ActivityBroadcaster {
  private readonly listeners = new Map<string, Set<ActivityListener>>();

  subscribe(parkingLotId: string, listener: ActivityListener): () => void {
    let bucket = this.listeners.get(parkingLotId);
    if (!bucket) {
      bucket = new Set();
      this.listeners.set(parkingLotId, bucket);
    }
    bucket.add(listener);
    return () => {
      const current = this.listeners.get(parkingLotId);
      if (!current) return;
      current.delete(listener);
      if (current.size === 0) {
        this.listeners.delete(parkingLotId);
      }
    };
  }

  publish(parkingLotId: string, event: ActivityEvent): void {
    const bucket = this.listeners.get(parkingLotId);
    if (!bucket) return;
    for (const listener of bucket) {
      try {
        listener(event);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        console.error(
          JSON.stringify({
            level: 'error',
            message: 'activity-broadcaster.listener-failed',
            parkingLotId,
            reason,
          }),
        );
      }
    }
  }
}
