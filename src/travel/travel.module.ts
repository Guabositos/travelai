import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TravelController } from './travel.controller';
import { TravelService } from './travel.service';
import { ChatSessionEntity } from '../chat/entities/chat-session.entity';
import { PlannerModule } from '../agents/planner/planner.module';
import { DestinationModule } from '../agents/destination/destination.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSessionEntity]),
    PlannerModule,
    DestinationModule,
  ],
  controllers: [TravelController],
  providers: [TravelService],
})
export class TravelModule {}