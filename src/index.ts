import type { TrackDeviceOptions, TrackResult } from './types.js';
export type { TrackDeviceOptions, TrackResult };

import { getModule } from './loader.js';

/**
 * Load the device tracking module and collect a device fingerprint.
 *
 * The module is loaded once per host and cached for subsequent calls.
 * If loading fails, the cache is cleared so the next call retries.
 *
 * @param options - Configuration including the required accountId.
 * @throws {Error} If options is null/undefined or not an object.
 * @throws {Error} If accountId is not a positive integer.
 * @throws {Error} If host is provided but not a valid hostname string.
 * @throws {Error} If disableWebglHash is provided but not a boolean.
 * @throws {Error} If the remote module fails to load or times out.
 * @throws {Error} If the remote module returns an invalid result.
 */
export async function trackDevice(
  options: TrackDeviceOptions
): Promise<TrackResult> {
  if (options == null || typeof options !== 'object') {
    throw new Error('options must be an object');
  }

  if (!Number.isInteger(options.accountId) || options.accountId <= 0) {
    throw new Error(
      `accountId must be a positive integer, received: ${JSON.stringify(options.accountId)} (${typeof options.accountId})`
    );
  }

  if (options.host !== undefined) {
    if (typeof options.host !== 'string' || options.host.length === 0) {
      throw new Error('host must be a non-empty string');
    }
    if (
      !/^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/.test(options.host) ||
      options.host.includes('..')
    ) {
      throw new Error(
        'host must be a valid hostname (e.g. "tracking.yourdomain.com")'
      );
    }
  }

  if (
    options.disableWebglHash !== undefined &&
    typeof options.disableWebglHash !== 'boolean'
  ) {
    throw new Error('disableWebglHash must be a boolean');
  }

  const mod = await getModule(options.host);

  const result = await mod.trackDevice(options);
  if (
    typeof result?.trackingToken !== 'string' ||
    result.trackingToken.length === 0
  ) {
    throw new Error(
      'Device tracking module returned an invalid result: trackingToken is missing or not a string'
    );
  }
  return result;
}
