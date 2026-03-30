import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';

import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';

import { User } from './auth/entities/user.entity';
import { ChatSessionEntity } from './chat/entities/chat-session.entity';
import { ChatMessageEntity } from './chat/entities/chat-session.entity';

@Module({
  imports: [
    ConfigModule,

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dbConfig = configService.getDatabaseConfig();
        return {
          type: 'mysql',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          entities: [User, ChatSessionEntity, ChatMessageEntity],
          synchronize: true,
          charset: 'utf8mb4',
        };
      },
    }),

    AuthModule,
    ChatModule,
  ],
})
export class AppModule {}