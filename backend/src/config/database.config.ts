
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  // Always use PostgreSQL (Supabase) for all environments
  return {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false, // Tables created - keep false for production safety
    logging: process.env.NODE_ENV === 'development',
    ssl: {
      rejectUnauthorized: false,
    },
  };
};
