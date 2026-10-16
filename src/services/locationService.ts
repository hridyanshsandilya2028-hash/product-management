import type { LocationCoordinates } from "../types";

export interface LocationService {
  getCurrentLocation: () => Promise<LocationCoordinates>;
}

export class MockLocationService implements LocationService {
  async getCurrentLocation(): Promise<LocationCoordinates> {
    return { latitude: 40.7128, longitude: -74.006, accuracy: 30 };
  }
}

export class BrowserLocationService implements LocationService {
  async getCurrentLocation(): Promise<LocationCoordinates> {
    if (!("geolocation" in navigator)) {
      return new MockLocationService().getCurrentLocation();
    }
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
        (error) => reject(new Error(`Location unavailable: ${error.message}`)),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
      );
    });
  }
}

export const locationService: LocationService = new BrowserLocationService();
