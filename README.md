# MaxMind Device Tracking Add-On

A thin loader package for MaxMind's [minFraud device tracking](https://dev.maxmind.com/minfraud/track-devices)
system. This package dynamically loads the device fingerprinting module from
MaxMind's servers at runtime, ensuring you always get the latest version without
updating the npm package.

The package itself contains no fingerprinting logic — it validates inputs, loads
the remote module, and returns the tracking token.

## Installation

```bash
npm install @maxmind/device-tracking
```

## Usage

```typescript
import { trackDevice } from '@maxmind/device-tracking';

const result = await trackDevice({ accountId: 123456 });
console.log(result.trackingToken);
```

### Ad-blocker bypass

If you proxy MaxMind's device tracking through your own subdomain (to avoid
ad-blockers), pass the `host` option. The module will be loaded from your
custom host, and the host value is passed to the remote module for its own use:

```typescript
const result = await trackDevice({
  accountId: 123456,
  host: 'tracking.yourdomain.com',
});
```

### Disable WebGL hash

For performance or compatibility, you can disable WebGL hash collection:

```typescript
const result = await trackDevice({
  accountId: 123456,
  disableWebglHash: true,
});
```

## API reference

### `trackDevice(options: TrackDeviceOptions): Promise<TrackResult>`

Loads the device tracking module (if not already cached) and collects a device
fingerprint.

### `TrackDeviceOptions`

| Property           | Type      | Required | Description                                     |
| ------------------ | --------- | -------- | ----------------------------------------------- |
| `accountId`        | `number`  | Yes      | Your MaxMind account ID (positive integer)      |
| `host`             | `string`  | No       | Custom hostname for ad-blocker bypass            |
| `disableWebglHash` | `boolean` | No       | Disable WebGL hash collection                    |

### `TrackResult`

| Property        | Type     | Description                    |
| --------------- | -------- | ------------------------------ |
| `trackingToken` | `string` | Opaque device tracking token   |
