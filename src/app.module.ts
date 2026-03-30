import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TravelModule } from './travel/travel.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [AuthModule,AuthModule,
    ChatModule,
    TravelModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
