import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, NotificationsModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
