import { AggregateRoot } from '@domain/shared/aggregate-root.ts';
import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type CameraNameVO } from '@domain/parking/value-objects/camera-name-vo.ts';
import { type StreamUrlVO } from '@domain/parking/value-objects/stream-url-vo.ts';
import { CameraStatusVO } from '@domain/parking/value-objects/camera-status-vo.ts';
import { EntityAlreadyDeactivatedError } from '@domain/parking/errors/entity-already-deactivated.ts';
import { cameraRegisteredMapper } from '@domain/parking/aggregates/camera/events/camera-registered-mapper.ts';
import { cameraStreamUrlChangedMapper } from '@domain/parking/aggregates/camera/events/camera-stream-url-changed-mapper.ts';
import { cameraWentOnlineMapper } from '@domain/parking/aggregates/camera/events/camera-went-online-mapper.ts';
import { cameraWentOfflineMapper } from '@domain/parking/aggregates/camera/events/camera-went-offline-mapper.ts';

export interface CameraProperties {
  parkingLotId: UniqueIdentifier;
  name: CameraNameVO;
  streamUrl: StreamUrlVO;
  status: CameraStatusVO;
  lastSeenAt: Date | null;
  deactivatedAt: Date | null;
}

export interface RegisterCameraInput {
  parkingLotId: UniqueIdentifier;
  name: CameraNameVO;
  streamUrl: StreamUrlVO;
  registeredAt: Date;
}

export class Camera extends AggregateRoot<CameraProperties> {
  constructor(properties: CameraProperties, identifier?: UniqueIdentifier) {
    super(properties, identifier);
  }

  static register(input: RegisterCameraInput): Camera {
    const camera = new Camera({
      parkingLotId: input.parkingLotId,
      name: input.name,
      streamUrl: input.streamUrl,
      status: CameraStatusVO.unregistered(),
      lastSeenAt: null,
      deactivatedAt: null,
    });

    camera.addDomainEvent(
      cameraRegisteredMapper.toEvent(camera, { registeredAt: input.registeredAt }),
    );

    return camera;
  }

  rename(newName: CameraNameVO): void {
    this.ensureActive();
    this.properties.name = newName;
  }

  updateStream(newStreamUrl: StreamUrlVO, changedAt: Date): void {
    this.ensureActive();

    if (this.properties.streamUrl.equals(newStreamUrl)) {
      return;
    }

    const previous = this.properties.streamUrl.value();
    this.properties.streamUrl = newStreamUrl;

    this.addDomainEvent(
      cameraStreamUrlChangedMapper.toEvent(this, {
        previousStreamUrl: previous,
        changedAt,
      }),
    );
  }

  recordHeartbeat(observedAt: Date): void {
    this.ensureActive();

    const previous = this.properties.status;
    this.properties.lastSeenAt = new Date(observedAt.getTime());
    this.properties.status = CameraStatusVO.online();

    if (!previous.isOnline()) {
      this.addDomainEvent(cameraWentOnlineMapper.toEvent(this, { observedAt }));
    }
  }

  markOffline(observedAt: Date): void {
    if (this.properties.status.isOffline()) {
      return;
    }

    const lastSeen = this.properties.lastSeenAt;
    this.properties.status = CameraStatusVO.offline();

    this.addDomainEvent(
      cameraWentOfflineMapper.toEvent(this, {
        lastSeenAt: lastSeen,
        observedAt,
      }),
    );
  }

  deactivate(now: Date): void {
    if (this.isDeactivated()) {
      throw new EntityAlreadyDeactivatedError('Camera', this.identifier.value());
    }

    this.properties.deactivatedAt = new Date(now.getTime());
  }

  isDeactivated(): boolean {
    return this.properties.deactivatedAt != null;
  }

  isActive(): boolean {
    return !this.isDeactivated();
  }

  id(): UniqueIdentifier {
    return this.identifier;
  }

  parkingLotId(): UniqueIdentifier {
    return this.properties.parkingLotId;
  }

  name(): CameraNameVO {
    return this.properties.name;
  }

  streamUrl(): StreamUrlVO {
    return this.properties.streamUrl;
  }

  status(): CameraStatusVO {
    return this.properties.status;
  }

  lastSeenAt(): Date | null {
    return this.properties.lastSeenAt ? new Date(this.properties.lastSeenAt.getTime()) : null;
  }

  deactivatedAt(): Date | null {
    return this.properties.deactivatedAt ? new Date(this.properties.deactivatedAt.getTime()) : null;
  }

  private ensureActive(): void {
    if (this.isDeactivated()) {
      throw new EntityAlreadyDeactivatedError('Camera', this.identifier.value());
    }
  }
}
