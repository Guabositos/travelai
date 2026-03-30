import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSessionEntity } from '../chat/entities/chat-session.entity';
import { PlannerAgent } from '../agents/planner/planner.agent';
import { DestinationAgent } from '../agents/destination/destination.agent';
import { GenerateItineraryDto } from './dto/travel.dto';

@Injectable()
export class TravelService {
  constructor(
    @InjectRepository(ChatSessionEntity)
    private sessionRepo: Repository<ChatSessionEntity>,
    private plannerAgent: PlannerAgent,
    private destinationAgent: DestinationAgent,
  ) {}

  async generateItinerary(dto: GenerateItineraryDto) {
    const prefs = {
      destination: dto.destination,
      startDate: dto.startDate,
      endDate: dto.endDate,
      ...dto.preferences,
    };

    const destinations = await this.destinationAgent.findDestinations(prefs);
    const top = destinations[0] ?? { name: dto.destination, country: '', score: 80, reasons: [], estimatedDailyCost: 100 };
    const plan = await this.plannerAgent.buildPlan(prefs, top);

    // Return shape matching frontend TravelItinerary type exactly
    return {
      id: `itinerary_${Date.now()}`,
      destination: dto.destination,
      startDate: dto.startDate,
      endDate: dto.endDate,
      activities: (plan.days ?? []).flatMap((d, i) =>
        d.activities.map((a, j) => ({
          id: `act_${i}_${j}`,
          name: a,
          date: d.date,
          location: dto.destination,
          description: a,
          category: 'general',
          cost: d.estimatedCost / (d.activities.length || 1),
        })),
      ),
      accommodations: (plan.days ?? []).map((d, i) => ({
        id: `acc_${i}`,
        name: d.accommodation,
        checkInDate: d.date,
        checkOutDate: d.date,
        address: dto.destination,
        costPerNight: d.estimatedCost * 0.4,
        nights: 1,
      })),
      flights: [],
      budget: plan.totalEstimatedCost,
      notes: plan.warnings?.join('. ') ?? '',
    };
  }

  async updateItinerary(itineraryId: string, updates: Record<string, any>) {
    // Find session that holds this itinerary and update it
    const session = await this.sessionRepo.findOne({
      where: { itinerary: { id: itineraryId } as any },
    });
    if (!session) throw new NotFoundException('Itinerary not found');
    const merged = { ...(session.itinerary ?? {}), ...updates };
    await this.sessionRepo.update(session.id, { itinerary: merged });
    return merged;
  }

  async exportItinerary(itineraryId: string, format: 'pdf' | 'json') {
    // For now returns JSON — PDF export can be added with a pdf library later
    return { format, itineraryId, exported: true };
  }
}
