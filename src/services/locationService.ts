import type { LocationCoordinates } from "../types";

export interface LocationService {
  getCurrentLocation: () => Promise<LocationCoordinates>;
}

export class MockLocationService implements LocationService {
  async getCurrentLocation(): Promise<LocationCoordinates> {
    return { latitude: 40.7128, longitude: -74.006, accuracy: 30 };
  }
}

export const locationService: LocationService = new MockLocationService();
