import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  Body,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.findAll(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: any) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Patch(':id/read')
  markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(req.user.id, id);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  delete(@Req() req: any, @Param('id') id: string) {
    return this.notificationsService.delete(req.user.id, id);
  }
}
