
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  // Always use PostgreSQL (Supabase) for all environments
  return {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false, // Keep false in production - use migrations
    logging: false,
    ssl: {
      rejectUnauthorized: false,
    },
  };
};
