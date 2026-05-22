import { inject, injectable } from 'inversify';

import { TYPES } from '@app/dto/types.ts';
import { type CameraRepository } from '@domain/parking/repositories/camera-repository.ts';
import { type DomainEventPublisher } from '@domain/shared/events/domain-event-publisher.ts';

export interface OfflineCameraSweeperOptions {
  intervalMs: number;
  staleAfterMs: number;
}

const DEFAULT_OPTIONS: OfflineCameraSweeperOptions = {
  intervalMs: 15_000,
  staleAfterMs: 30_000,
};

@injectable()
export class OfflineCameraSweeper {
  private readonly cameras: CameraRepository;
  private readonly publisher: DomainEventPublisher;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    @inject(TYPES.CameraRepository) cameras: CameraRepository,
    @inject(TYPES.DomainEventPublisher) publisher: DomainEventPublisher,
  ) {
    this.cameras = cameras;
    this.publisher = publisher;
  }

  start(options: Partial<OfflineCameraSweeperOptions> = {}): void {
    if (this.timer) return;
    const merged = { ...DEFAULT_OPTIONS, ...options };
    this.timer = setInterval(() => {
      void this.sweep(merged.staleAfterMs);
    }, merged.intervalMs);
    this.timer.unref?.();
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  async sweep(staleAfterMs: number): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const observedAt = new Date();
      const staleBefore = new Date(observedAt.getTime() - staleAfterMs);
      const stale = await this.cameras.findStaleOnline({ staleBefore });
      for (const camera of stale) {
        camera.markOffline(observedAt);
        await this.cameras.save(camera);
        await this.publisher.publish(camera.pullDomainEvents());
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(
        JSON.stringify({
          level: 'error',
          message: 'offline-camera-sweeper.sweep-failed',
          reason,
        }),
      );
    } finally {
      this.running = false;
    }
  }
}
