export const TYPES = {
  // Mappers (infra/database/kysely/mappers)
  ParkingSpotMapper: Symbol('ParkingSpotMapper'),
  VehicleMapper: Symbol('VehicleMapper'),
  ParkingSessionMapper: Symbol('ParkingSessionMapper'),

  // Repositories (interfaces in domain, impls in infra)
  ParkingSpotRepository: Symbol('ParkingSpotRepository'),
  VehicleRepository: Symbol('VehicleRepository'),
  ParkingSessionRepository: Symbol('ParkingSessionRepository'),
  DriverRepository: Symbol('DriverRepository'),
  ParkingLotRepository: Symbol('ParkingLotRepository'),

  // Services
  ParkingLotResolver: Symbol('ParkingLotResolver'),
  DomainEventPublisher: Symbol('DomainEventPublisher'),

  // App Services (event-driven handlers)
  RegisterVehicleEntryAppService: Symbol('RegisterVehicleEntryAppService'),
  RegisterSpotOccupationAppService: Symbol('RegisterSpotOccupationAppService'),
  RegisterSpotReleaseAppService: Symbol('RegisterSpotReleaseAppService'),
  FinishParkingSessionAppService: Symbol('FinishParkingSessionAppService'),

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
