import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { TrackDeviceOptions } from './types.js';

const mockTrackDevice =
  jest.fn<
    (options: TrackDeviceOptions) => Promise<{ trackingToken: string }>
  >();
const mockGetModule =
  jest.fn<
    (host?: string) => Promise<{ trackDevice: typeof mockTrackDevice }>
  >();

jest.unstable_mockModule('./loader.js', () => ({
  getModule: mockGetModule,
  resetModuleCache: jest.fn(),
}));

let trackDevice: typeof import('./index.js').trackDevice;

beforeEach(async () => {
  jest.clearAllMocks();
  const mod = await import('./index.js');
  trackDevice = mod.trackDevice;
});

describe('trackDevice', () => {
  describe('options validation', () => {
    it('rejects when options is null', async () => {
      await expect(
        trackDevice(null as unknown as TrackDeviceOptions)
      ).rejects.toThrow('options must be an object');
    });

    it('rejects when options is undefined', async () => {
      await expect(
        (trackDevice as (opts?: unknown) => Promise<unknown>)()
      ).rejects.toThrow('options must be an object');
    });
  });

  describe('accountId validation', () => {
    it('rejects when accountId is missing', async () => {
      await expect(trackDevice({} as { accountId: number })).rejects.toThrow(
        'accountId must be a positive integer'
      );
    });

    it('rejects when accountId is zero', async () => {
      await expect(trackDevice({ accountId: 0 })).rejects.toThrow(
        'accountId must be a positive integer'
      );
    });

    it('rejects when accountId is negative', async () => {
      await expect(trackDevice({ accountId: -1 })).rejects.toThrow(
        'accountId must be a positive integer'
      );
    });

    it('rejects when accountId is a float', async () => {
      await expect(trackDevice({ accountId: 1.5 })).rejects.toThrow(
        'accountId must be a positive integer'
      );
    });

    it('rejects when accountId is NaN', async () => {
      await expect(trackDevice({ accountId: NaN })).rejects.toThrow(
        'accountId must be a positive integer'
      );
    });

    it('includes the received value and type in the error message', async () => {
      await expect(
        trackDevice({ accountId: '123' } as unknown as TrackDeviceOptions)
      ).rejects.toThrow('received: "123" (string)');
    });
  });

  describe('host validation', () => {
    it('rejects when host is an empty string', async () => {
      await expect(trackDevice({ accountId: 1, host: '' })).rejects.toThrow(
        'host must be a non-empty string'
      );
    });

    it('rejects when host is not a string', async () => {
      await expect(
        trackDevice({ accountId: 1, host: 42 } as unknown as TrackDeviceOptions)
      ).rejects.toThrow('host must be a non-empty string');
    });

    it('rejects when host contains invalid characters', async () => {
      await expect(
        trackDevice({ accountId: 1, host: 'evil.com/foo#' })
      ).rejects.toThrow('host must be a valid hostname');
    });

    it('rejects when host starts with a dot', async () => {
      await expect(
        trackDevice({ accountId: 1, host: '.evil.com' })
      ).rejects.toThrow('host must be a valid hostname');
    });

    it('rejects when host starts with a hyphen', async () => {
      await expect(
        trackDevice({ accountId: 1, host: '-evil.com' })
      ).rejects.toThrow('host must be a valid hostname');
    });

    it('rejects when host contains consecutive dots', async () => {
      await expect(
        trackDevice({ accountId: 1, host: 'evil..com' })
      ).rejects.toThrow('host must be a valid hostname');
    });

    it('rejects when host is only dots', async () => {
      await expect(trackDevice({ accountId: 1, host: '...' })).rejects.toThrow(
        'host must be a valid hostname'
      );
    });
  });

  describe('disableWebglHash validation', () => {
    it('rejects when disableWebglHash is not a boolean', async () => {
      await expect(
        trackDevice({
          accountId: 1,
          disableWebglHash: 'yes',
        } as unknown as TrackDeviceOptions)
      ).rejects.toThrow('disableWebglHash must be a boolean');
    });

    it('rejects when disableWebglHash is a number', async () => {
      await expect(
        trackDevice({
          accountId: 1,
          disableWebglHash: 1,
        } as unknown as TrackDeviceOptions)
      ).rejects.toThrow('disableWebglHash must be a boolean');
    });

    it('accepts when disableWebglHash is omitted', async () => {
      mockTrackDevice.mockResolvedValue({ trackingToken: 'token' });
      mockGetModule.mockResolvedValue({ trackDevice: mockTrackDevice });

      await expect(trackDevice({ accountId: 1 })).resolves.toEqual({
        trackingToken: 'token',
      });
    });
  });

  describe('successful tracking', () => {
    it('returns trackingToken from the remote module', async () => {
      mockTrackDevice.mockResolvedValue({
        trackingToken: 'abc-123',
      });
      mockGetModule.mockResolvedValue({ trackDevice: mockTrackDevice });

      const result = await trackDevice({ accountId: 123456 });
      expect(result).toEqual({ trackingToken: 'abc-123' });
    });

    it('passes options through to the remote module', async () => {
      mockTrackDevice.mockResolvedValue({ trackingToken: 'token' });
      mockGetModule.mockResolvedValue({ trackDevice: mockTrackDevice });

      await trackDevice({
        accountId: 123456,
        host: 'tracking.example.com',
        disableWebglHash: true,
      });

      expect(mockTrackDevice).toHaveBeenCalledWith({
        accountId: 123456,
        host: 'tracking.example.com',
        disableWebglHash: true,
      });
    });

    it('passes host to getModule', async () => {
      mockTrackDevice.mockResolvedValue({ trackingToken: 'token' });
      mockGetModule.mockResolvedValue({ trackDevice: mockTrackDevice });

      await trackDevice({
        accountId: 123456,
        host: 'custom.example.com',
      });

      expect(mockGetModule).toHaveBeenCalledWith('custom.example.com');
    });
  });

  describe('result validation', () => {
    it('rejects when trackingToken is an empty string', async () => {
      mockTrackDevice.mockResolvedValue({ trackingToken: '' });
      mockGetModule.mockResolvedValue({ trackDevice: mockTrackDevice });

      await expect(trackDevice({ accountId: 123456 })).rejects.toThrow(
        'trackingToken is missing or not a string'
      );
    });

    it('rejects when trackingToken is not a string', async () => {
      mockTrackDevice.mockResolvedValue({ trackingToken: 12345 } as unknown as {
        trackingToken: string;
      });
      mockGetModule.mockResolvedValue({ trackDevice: mockTrackDevice });

      await expect(trackDevice({ accountId: 123456 })).rejects.toThrow(
        'trackingToken is missing or not a string'
      );
    });

    it('rejects when trackingToken is missing', async () => {
      mockTrackDevice.mockResolvedValue(
        {} as unknown as { trackingToken: string }
      );
      mockGetModule.mockResolvedValue({ trackDevice: mockTrackDevice });

      await expect(trackDevice({ accountId: 123456 })).rejects.toThrow(
        'trackingToken is missing or not a string'
      );
    });
  });

  describe('error handling', () => {
    it('propagates errors from the remote module', async () => {
      const error = new Error('request failed');
      mockTrackDevice.mockRejectedValue(error);
      mockGetModule.mockResolvedValue({ trackDevice: mockTrackDevice });

      await expect(trackDevice({ accountId: 123456 })).rejects.toBe(error);
    });

    it('propagates errors from getModule', async () => {
      const error = new Error('load failed');
      mockGetModule.mockRejectedValue(error);

      await expect(trackDevice({ accountId: 123456 })).rejects.toBe(error);
    });
  });
});
