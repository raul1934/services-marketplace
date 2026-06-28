// Only the HTTP transport is shared — each app defines its own API surface
// (no shared endpoint definitions across customer/provider).
export * from './client';
export * from './pagination';
