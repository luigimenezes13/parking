import { Driver } from '@domain/parking/entities/driver.ts';

export interface MakeDriverOverrides {
  cnh?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export function makeDriver(overrides: MakeDriverOverrides = {}): Driver {
  return Driver.register({
    cnh: overrides.cnh ?? '12345678901',
    name: overrides.name ?? 'Test Driver',
    email: overrides.email ?? 'driver@example.com',
    phone: overrides.phone ?? '+5511999999999',
  });
}
