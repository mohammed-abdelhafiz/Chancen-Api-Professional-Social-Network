import { Module } from '@nestjs/common';
import { RepostsService } from './reposts.service';
import { RepostsController } from './reposts.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [RepostsController],
  providers: [RepostsService],
})
export class RepostsModule {}
