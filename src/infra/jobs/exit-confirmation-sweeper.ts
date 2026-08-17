import { inject, injectable } from 'inversify';

import { TYPES } from '@app/dto/types.ts';
import { type ParkingSessionRepository } from '@domain/parking/repositories/parking-session-repository.ts';
import { type DomainEventPublisher } from '@domain/shared/events/domain-event-publisher.ts';

export interface ExitConfirmationSweeperOptions {
  intervalMs: number;
  graceAfterMs: number;
}

const DEFAULT_OPTIONS: ExitConfirmationSweeperOptions = {
  intervalMs: 30_000,
  graceAfterMs: 180_000,
};

// A camera pode perder o veiculo por alguns ciclos sem que ele tenha saido, entao
// uma vaga liberada so encerra a sessao quando o carro nao volta a estacionar
// dentro da janela de tolerancia.
@injectable()
export class ExitConfirmationSweeper {
  private readonly sessions: ParkingSessionRepository;
  private readonly publisher: DomainEventPublisher;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    @inject(TYPES.ParkingSessionRepository) sessions: ParkingSessionRepository,
    @inject(TYPES.DomainEventPublisher) publisher: DomainEventPublisher,
  ) {
    this.sessions = sessions;
    this.publisher = publisher;
  }

  start(options: Partial<ExitConfirmationSweeperOptions> = {}): void {
    if (this.timer) return;
    const merged = { ...DEFAULT_OPTIONS, ...options };
    this.timer = setInterval(() => {
      void this.confirmExits(merged.graceAfterMs);
    }, merged.intervalMs);
    this.timer.unref?.();
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  async confirmExits(graceAfterMs: number): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const releasedBefore = new Date(Date.now() - graceAfterMs);
      const pending = await this.sessions.findAwaitingExitConfirmation({ releasedBefore });

      for (const session of pending) {
        const releasedAt = session.awaitsExitConfirmationSince();
        if (!releasedAt) {
          continue;
        }

        session.finish({ exitAt: releasedAt });
        await this.sessions.save(session);
        await this.publisher.publish(session.pullDomainEvents());

        console.info(
          JSON.stringify({
            level: 'info',
            message: 'exit-confirmation-sweeper.session-finished',
            sessionId: session.id().value(),
            releasedAt: releasedAt.toISOString(),
          }),
        );
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(
        JSON.stringify({
          level: 'error',
          message: 'exit-confirmation-sweeper.sweep-failed',
          reason,
        }),
      );
    } finally {
      this.running = false;
    }
  }
}
