export const TYPES = {
  // Database (Kysely instance)
  Database: Symbol('Database'),

  // Mappers (infra/database/kysely/mappers)
  ParkingSpotMapper: Symbol('ParkingSpotMapper'),
  VehicleMapper: Symbol('VehicleMapper'),
  ParkingSessionMapper: Symbol('ParkingSessionMapper'),
  DriverMapper: Symbol('DriverMapper'),
  ParkingLotMapper: Symbol('ParkingLotMapper'),
  CameraMapper: Symbol('CameraMapper'),
  ActivityEventMapper: Symbol('ActivityEventMapper'),

  // Repositories (interfaces in domain, impls in infra)
  ParkingSpotRepository: Symbol('ParkingSpotRepository'),
  VehicleRepository: Symbol('VehicleRepository'),
  ParkingSessionRepository: Symbol('ParkingSessionRepository'),
  DriverRepository: Symbol('DriverRepository'),
  ParkingLotRepository: Symbol('ParkingLotRepository'),
  CameraRepository: Symbol('CameraRepository'),
  ActivityEventRepository: Symbol('ActivityEventRepository'),

  // Services
  ParkingLotResolver: Symbol('ParkingLotResolver'),
  DomainEventPublisher: Symbol('DomainEventPublisher'),
  DomainEventBus: Symbol('DomainEventBus'),
  ActivityBroadcaster: Symbol('ActivityBroadcaster'),
  Clock: Symbol('Clock'),

  // App Services (event-driven handlers)
  RegisterVehicleEntryAppService: Symbol('RegisterVehicleEntryAppService'),
  RegisterSpotOccupationAppService: Symbol('RegisterSpotOccupationAppService'),
  RegisterSpotReleaseAppService: Symbol('RegisterSpotReleaseAppService'),
  FinishParkingSessionAppService: Symbol('FinishParkingSessionAppService'),
  ActivityRecorderAppService: Symbol('ActivityRecorderAppService'),

  // Messaging
  RecognitionEventPublisher: Symbol('RecognitionEventPublisher'),

  // Handlers
  VehicleEnteredHandler: Symbol('VehicleEnteredHandler'),
  SpotOccupiedHandler: Symbol('SpotOccupiedHandler'),
  SpotReleasedHandler: Symbol('SpotReleasedHandler'),
  VehicleExitedHandler: Symbol('VehicleExitedHandler'),

  // Event bus (legacy / future)
  EventBus: Symbol('EventBus'),
} as const;
