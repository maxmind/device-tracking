export interface TrackDeviceOptions {
  /** MaxMind account ID. Must be a positive integer (>= 1). */
  accountId: number;
  /** Custom hostname for ad-blocker bypass (e.g. 'tracking.customer.com'). */
  host?: string;
  /** Disable WebGL hash collection for performance or compatibility. */
  disableWebglHash?: boolean;
}

export interface TrackResult {
  trackingToken: string;
}
