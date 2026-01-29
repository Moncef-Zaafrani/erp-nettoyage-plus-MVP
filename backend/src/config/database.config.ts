
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  // Always use PostgreSQL (Supabase) for all environments
  return {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false, // Tables created - keep false for production safety
    // Only log errors and slow queries (>1s) in dev, nothing in prod
    logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
    maxQueryExecutionTime: 1000, // Log queries taking longer than 1s
    ssl: {
      rejectUnauthorized: false,
    },
  };
};
