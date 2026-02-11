import type { TrackDeviceOptions, TrackResult } from './types.js';
import { dynamicImport } from './dynamic-import.js';

const DEFAULT_HOST = 'device.maxmind.com';
const MODULE_PATH = '/js/device-module.js';
const LOAD_TIMEOUT_MS = 10_000;

interface DeviceModule {
  trackDevice: (options: TrackDeviceOptions) => Promise<TrackResult>;
}

const modulePromises = new Map<string, Promise<DeviceModule>>();

function buildModuleUrl(host: string): string {
  return `https://${host}${MODULE_PATH}`;
}

async function loadModule(host: string): Promise<DeviceModule> {
  const url = buildModuleUrl(host);

  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(
            `Loading device tracking module from ${url} timed out after ${LOAD_TIMEOUT_MS}ms`
          )
        ),
      LOAD_TIMEOUT_MS
    );
  });

  // Wrap import errors specifically — timeout and validation errors
  // propagate with their own messages, unwrapped.
  const importPromise = (dynamicImport(url) as Promise<DeviceModule>).catch(
    (err: unknown) => {
      throw new Error(
        `Failed to load device tracking module from ${url}: ${err instanceof Error ? err.message : String(err)}`,
        { cause: err }
      );
    }
  );

  let mod: DeviceModule;
  try {
    mod = await Promise.race([importPromise, timeout]);
  } finally {
    clearTimeout(timer!);
    // If the timeout won, the import may later reject — suppress it.
    importPromise.catch(() => {});
  }

  if (mod == null || typeof mod !== 'object') {
    throw new Error(`Loaded module from ${url} is not a valid object`);
  }

  if (typeof mod.trackDevice !== 'function') {
    throw new Error('Loaded module does not export trackDevice');
  }

  return mod;
}

export function getModule(host?: string): Promise<DeviceModule> {
  const effectiveHost = host ?? DEFAULT_HOST;
  let promise = modulePromises.get(effectiveHost);

  if (!promise) {
    promise = loadModule(effectiveHost).catch((err: unknown) => {
      // Clear cache so next call retries
      modulePromises.delete(effectiveHost);
      throw err;
    });
    modulePromises.set(effectiveHost, promise);
  }

  return promise;
}

/** @internal Reset the cached module (for testing). */
export function resetModuleCache(): void {
  modulePromises.clear();
}
