import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSessionEntity, ChatMessageEntity } from './entities/chat-session.entity';
import { SupervisorAgent } from '../agents/supervisor/supervisor.agent';
import { CreateSessionDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSessionEntity)
    private sessionRepo: Repository<ChatSessionEntity>,
    @InjectRepository(ChatMessageEntity)
    private messageRepo: Repository<ChatMessageEntity>,
    private supervisor: SupervisorAgent,
  ) {}

  async createSession(userId: string, dto: CreateSessionDto) {
    const session = this.sessionRepo.create({ title: dto.title, userId });
    return this.sessionRepo.save(session);
  }

  async listSessions(userId: string) {
    return this.sessionRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      relations: ['messages'],
    });
  }

  async getSession(sessionId: string, userId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['messages'],
      order: { messages: { timestamp: 'ASC' } } as any,
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();
    return session;
  }

  async sendMessage(sessionId: string, userId: string, content: string) {
    const session = await this.getSession(sessionId, userId);

    // Save user message
    const userMsg = this.messageRepo.create({
      role: 'user',
      content,
      sessionId,
    });
    await this.messageRepo.save(userMsg);

    // Run through supervisor agent
    const result = await this.supervisor.handleMessage(sessionId, content);

    // Save assistant message
    const assistantMsg = this.messageRepo.create({
      role: 'assistant',
      content: result.message,
      sessionId,
      metadata: { plan: result.plan, step: result.step },
    });
    await this.messageRepo.save(assistantMsg);

    // Update session itinerary if plan changed
    if (result.plan) {
      await this.sessionRepo.update(sessionId, {
        itinerary: result.plan as unknown as Record<string, unknown>,
      });
    }

    // Return shape matching frontend ChatResponse type exactly
    return {
      message: {
        id: assistantMsg.id,
        role: assistantMsg.role,
        content: assistantMsg.content,
        timestamp: assistantMsg.timestamp,
        metadata: assistantMsg.metadata,
      },
      suggestions: [],
      updatedItinerary: result.plan ?? undefined,
    };
  }
}