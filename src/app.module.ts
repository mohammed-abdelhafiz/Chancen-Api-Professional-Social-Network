import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
})
export class AppModule {}
