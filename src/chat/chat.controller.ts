import {
  Controller, Get, Post, Body, Param,
  UseGuards, HttpCode, HttpStatus
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { CreateSessionDto, SendMessageDto } from './dto/chat.dto';

@UseGuards(JwtAuthGuard)  // all chat routes require auth
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  // POST /chat/sessions
  @Post('sessions')
  createSession(@CurrentUser() user: User, @Body() dto: CreateSessionDto) {
    return this.chatService.createSession(user.id, dto);
  }

  // GET /chat/sessions
  @Get('sessions')
  listSessions(@CurrentUser() user: User) {
    return this.chatService.listSessions(user.id);
  }

  // GET /chat/:sessionId
  @Get(':sessionId')
  getSession(@Param('sessionId') sessionId: string, @CurrentUser() user: User) {
    return this.chatService.getSession(sessionId, user.id);
  }

  // POST /chat/:sessionId/messages
  @Post(':sessionId/messages')
  @HttpCode(HttpStatus.OK)
  sendMessage(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: User,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(sessionId, user.id, dto.content);
  }
}