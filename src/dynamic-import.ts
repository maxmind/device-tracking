// Wrapper around dynamic import() to enable test mocking.
// webpackIgnore prevents webpack from bundling this dynamic import;
// the module is always loaded from the remote host at runtime.
export function dynamicImport(url: string): Promise<unknown> {
  return import(/* webpackIgnore: true */ url);
}
