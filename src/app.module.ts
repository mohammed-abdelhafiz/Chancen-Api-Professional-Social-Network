import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { Module } from '@nestjs/common';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { JobsModule } from './jobs/jobs.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SearchModule } from './search/search.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { RepostsModule } from './reposts/reposts.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 30 },
      { name: 'long', ttl: 600000, limit: 100 },
    ]),
    AuthModule,
    UsersModule,
    PostsModule,
    JobsModule,
    MessagesModule,
    NotificationsModule,
    SearchModule,
    BookmarksModule,
    RepostsModule,
    PrismaModule,
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

