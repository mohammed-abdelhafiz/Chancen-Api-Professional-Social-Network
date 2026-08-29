import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { currentUser } from 'src/auth/decorators/current-user.decorator';
import { UserResponseDto } from 'src/users/dtos/user-response.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @currentUser() user: UserResponseDto,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.notificationsService.findAll(user.id, page, limit);
  }

  @Get('unread-count')
  getUnreadCount(@currentUser() user: UserResponseDto) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch('read-all')
  markAllAsRead(@currentUser() user: UserResponseDto) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Patch(':id/read')
  markAsRead(
    @currentUser() user: UserResponseDto,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Delete(':id')
  delete(
    @currentUser() user: UserResponseDto,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationsService.delete(user.id, id);
  }
}
