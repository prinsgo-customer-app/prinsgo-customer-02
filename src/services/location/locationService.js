/* eslint-disable import/no-unresolved */
import AutoProvider from './AutoProvider';
import FreeProvider from './FreeProvider';
import GoogleProvider from './GoogleProvider';
import { getSettings } from '../../api/auth';

class LocationService {
  constructor() {
    this.freeProvider = new FreeProvider();
    this.googleProvider = new GoogleProvider();
    this.autoProvider = new AutoProvider();

    // Default location provider is FREE as per requirement
    this.provider = this.freeProvider;
    this.settingsLoaded = false;
  }

  async init() {
    if (this.settingsLoaded) return;
    try {
      const res = await getSettings();
      const settings = res.data?.settings || {};
      const providerType = settings.locationProvider || 'free';
      const googleEnabled = settings.googlePlacesEnabled || false;

      if (providerType === 'google' && googleEnabled) {
        this.provider = this.googleProvider;
      } else if (providerType === 'auto') {
        this.provider = this.autoProvider;
      } else {
        this.provider = this.freeProvider;
      }
      this.settingsLoaded = true;
    } catch (err) {
      // On network/auth error during boot, gracefully remain on default free provider
      this.provider = this.freeProvider;
    }
  }

  getProvider() {
    return this.provider;
  }
}

const locationService = new LocationService();
export default locationService;
