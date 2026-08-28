import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, NotificationsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
