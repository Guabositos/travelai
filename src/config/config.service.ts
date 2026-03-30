import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class ConfigService {
  get(key: string, fallback?: string): string {
    return process.env[key] ?? fallback ?? '';
  }

  getDatabaseConfig() {
    return {
      host:     this.get('DATABASE_HOST', 'localhost'),
      port:     parseInt(this.get('DATABASE_PORT', '3306')),
      username: this.get('DATABASE_USERNAME', 'root'),
      password: this.get('DATABASE_PASSWORD'),
      database: this.get('DATABASE_NAME'),
    };
  }

  getJwtConfig() {
    return {
      accessSecret:  this.get('JWT_ACCESS_SECRET'),
      refreshSecret: this.get('JWT_REFRESH_SECRET'),
      accessExpiry:  this.get('JWT_ACCESS_EXPIRES', '15m'),
      refreshExpiry: this.get('JWT_REFRESH_EXPIRES', '7d'),
    };
  }

  get isDevelopment() {
    return this.get('NODE_ENV', 'development') === 'development';
  }
}