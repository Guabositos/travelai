import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSessionEntity, ChatMessageEntity } from './entities/chat-session.entity';
import { CreateSessionDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSessionEntity)
    private sessionRepo: Repository<ChatSessionEntity>,
    @InjectRepository(ChatMessageEntity)
    private messageRepo: Repository<ChatMessageEntity>,
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
    // Verify session belongs to this user
    await this.getSession(sessionId, userId);

    // Save user message
    const userMsg = this.messageRepo.create({ role: 'user', content, sessionId });
    await this.messageRepo.save(userMsg);

    // Placeholder reply — swap this block for supervisor.handleMessage() when agents are ready
    const assistantMsg = this.messageRepo.create({
      role: 'assistant',
      content: 'Agent pipeline not connected yet. Your message was received.',
      sessionId,
      metadata: {},
    });
    await this.messageRepo.save(assistantMsg);

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
      updatedItinerary: undefined,
    };
  }
}