import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from '@jest/globals';

let getModule: typeof import('./loader.js').getModule;
let resetModuleCache: typeof import('./loader.js').resetModuleCache;

beforeEach(async () => {
  jest.restoreAllMocks();
  jest.resetModules();
  const loader = await import('./loader.js');
  getModule = loader.getModule;
  resetModuleCache = loader.resetModuleCache;
});

describe('getModule', () => {
  it('loads the module from the default host', async () => {
    // In test environment, dynamic import() of a remote URL will fail,
    // which exercises the error wrapping path.
    await expect(getModule()).rejects.toThrow();
  });

  it('retries after a load failure (cache cleared on error)', async () => {
    const firstAttempt = getModule();
    await expect(firstAttempt).rejects.toThrow();

    // Cache should be cleared on failure, so next call is a fresh attempt
    const secondAttempt = getModule();
    await expect(secondAttempt).rejects.toThrow();

    expect(firstAttempt).not.toBe(secondAttempt);
  });

  it('constructs the correct URL for a custom host', async () => {
    await expect(getModule('tracking.example.com')).rejects.toThrow(
      'tracking.example.com/js/device-module.js'
    );
  });

  it('constructs the correct URL for the default host', async () => {
    await expect(getModule()).rejects.toThrow(
      'device.maxmind.com/js/device-module.js'
    );
  });

  it('resets the module cache', async () => {
    const p1 = getModule();
    await expect(p1).rejects.toThrow();

    resetModuleCache();

    const p2 = getModule();
    await expect(p2).rejects.toThrow();

    expect(p1).not.toBe(p2);
  });

  it('returns the same promise for concurrent calls with the same host', async () => {
    const p1 = getModule('same-host.example.com');
    const p2 = getModule('same-host.example.com');
    expect(p1).toBe(p2);
    await expect(p1).rejects.toThrow();
  });
});

describe('getModule with mocked module', () => {
  it('resolves when the module exports a valid trackDevice function', async () => {
    jest.resetModules();
    jest.unstable_mockModule('./dynamic-import.js', () => ({
      dynamicImport: jest
        .fn<(url: string) => Promise<unknown>>()
        .mockResolvedValue({
          trackDevice: jest.fn(),
        }),
    }));
    const { getModule: gm } = await import('./loader.js');
    const mod = await gm();
    expect(typeof mod.trackDevice).toBe('function');
  });

  it('rejects when dynamicImport resolves with null', async () => {
    jest.resetModules();
    jest.unstable_mockModule('./dynamic-import.js', () => ({
      dynamicImport: jest
        .fn<(url: string) => Promise<unknown>>()
        .mockResolvedValue(null),
    }));
    const { getModule: gm } = await import('./loader.js');
    await expect(gm()).rejects.toThrow('is not a valid object');
  });

  it('rejects when the loaded module does not export trackDevice', async () => {
    jest.resetModules();
    jest.unstable_mockModule('./dynamic-import.js', () => ({
      dynamicImport: jest
        .fn<(url: string) => Promise<unknown>>()
        .mockResolvedValue({
          somethingElse: jest.fn(),
        }),
    }));
    const { getModule: gm } = await import('./loader.js');
    await expect(gm()).rejects.toThrow('does not export trackDevice');
  });
});

describe('getModule timeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('rejects when loading exceeds 10 seconds', async () => {
    jest.resetModules();
    const loader = await import('./loader.js');
    loader.resetModuleCache();

    const promise = loader.getModule();

    jest.advanceTimersByTime(10_001);

    await expect(promise).rejects.toThrow(/timed out/);
  });
});
