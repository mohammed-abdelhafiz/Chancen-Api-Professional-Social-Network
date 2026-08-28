import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dtos/send-message.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { currentUser } from 'src/auth/decorators/current-user.decorator';
import { UserResponseDto } from 'src/users/dtos/user-response.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  getConversations(@currentUser() user: UserResponseDto) {
    return this.messagesService.getConversations(user.id);
  }

  @Post('conversations')
  getOrCreateConversation(
    @Body('receiverId') receiverId: string,
    @currentUser() user: UserResponseDto,
  ) {
    return this.messagesService.getOrCreateConversation(user.id, receiverId);
  }

  @Get('conversations/:id')
  getMessages(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @currentUser() user: UserResponseDto,
  ) {
    return this.messagesService.getMessages(id, user.id, page, limit);
  }

  @Post('conversations/:id')
  sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @currentUser() user: UserResponseDto,
  ) {
    return this.messagesService.sendMessage(id, user.id, dto.content);
  }

  @Get('unread')
  getUnreadCount(@currentUser() user: UserResponseDto) {
    return this.messagesService.getUnreadCount(user.id);
  }
}
