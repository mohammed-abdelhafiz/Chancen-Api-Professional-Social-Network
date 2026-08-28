import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BookmarksService {
  constructor(private readonly prismaService: PrismaService) {}

  async toggleBookmark(userId: string, postId: string) {
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.prismaService.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existing) {
      await this.prismaService.bookmark.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
      return { bookmarked: false, message: 'Bookmark removed' };
    }

    await this.prismaService.bookmark.create({
      data: {
        userId,
        postId,
      },
    });
    return { bookmarked: true, message: 'Post bookmarked' };
  }

  async getBookmarks(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      this.prismaService.bookmark.findMany({
        where: { userId },
        include: {
          post: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  headline: true,
                },
              },
              _count: {
                select: {
                  postLikes: true,
                  comments: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.bookmark.count({ where: { userId } }),
    ]);

    return {
      bookmarks: bookmarks.map((b) => b.post),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async isBookmarked(userId: string, postId: string) {
    const bookmark = await this.prismaService.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
    return { bookmarked: !!bookmark };
  }
}
