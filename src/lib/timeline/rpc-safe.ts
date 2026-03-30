/**
 * Drizzle/postgres return `Date` instances and occasionally other non-JSON values.
 * TanStack Start RPC (seroval) can fail to deserialize them on the client — normalize to JSON-safe data.
 */
export function rpcSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
