// Type declarations for modules where exports map doesn't specify types
declare module 'mysql2/promise' {
  export * from 'mysql2/typings/mysql/index.js';
  
  export interface PoolConnection {
    query<T = any>(sql: string, values?: any): Promise<[T, any[]]>;
    execute<T = any>(sql: string, values?: any): Promise<[T, any[]]>;
    beginTransaction(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    release(): void;
    end(): Promise<void>;
  }

  export interface Pool {
    query<T = any>(sql: string, values?: any): Promise<[T, any[]]>;
    execute<T = any>(sql: string, values?: any): Promise<[T, any[]]>;
    getConnection(): Promise<PoolConnection>;
    end(): Promise<void>;
  }

  export interface Connection {
    query<T = any>(sql: string, values?: any): Promise<[T, any[]]>;
    execute<T = any>(sql: string, values?: any): Promise<[T, any[]]>;
    beginTransaction(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    end(): Promise<void>;
  }

  export function createPool(config: any): Pool;
  export function createConnection(config: any): Promise<Connection>;

  export namespace mysql {
    export type { Pool, PoolConnection, Connection };
  }

  const mysql: {
    createPool: typeof createPool;
    createConnection: typeof createConnection;
  };

  export default mysql;
}
