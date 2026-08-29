import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ParseUUIDPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dtos/send-message.dto';
import { CreateConversationDto } from './dtos/create-conversation.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { currentUser } from 'src/auth/decorators/current-user.decorator';
import { UserResponseDto } from 'src/users/dtos/user-response.dto';
import { MessagesGateway } from './gateways/messages.gateway';
import { Throttle } from '@nestjs/throttler';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly gateway: MessagesGateway,
  ) {}

  @Get('unread')
  getUnreadCount(@currentUser() user: UserResponseDto) {
    return this.messagesService.getUnreadCount(user.id);
  }

  @Get('conversations')
  getConversations(@currentUser() user: UserResponseDto) {
    return this.messagesService.getConversations(user.id);
  }

  @Post('conversations')
  getOrCreateConversation(
    @Body() dto: CreateConversationDto,
    @currentUser() user: UserResponseDto,
  ) {
    return this.messagesService.getOrCreateConversation(
      user.id,
      dto.receiverId,
    );
  }

  @Get('conversations/:id')
  getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @currentUser() user: UserResponseDto,
  ) {
    return this.messagesService.getMessages(id, user.id, page, limit);
  }

  @Throttle({ short: { ttl: 60000, limit: 60 } })
  @Post('conversations/:id')
  async sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
    @currentUser() user: UserResponseDto,
  ) {
    const message = await this.messagesService.sendMessage(
      id,
      user.id,
      dto.content,
    );
    this.gateway.broadcastToConversation(id, message);
    return message;
  }
}
