import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RepostsService {
  constructor(private readonly prismaService: PrismaService) {}

  async createRepost(userId: string, postId: string, content?: string) {
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.prismaService.repost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('You have already reposted this post');
    }

    return this.prismaService.repost.create({
      data: {
        userId,
        postId,
        content: content?.trim() || null,
      },
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
          },
        },
      },
    });
  }

  async deleteRepost(userId: string, postId: string) {
    const repost = await this.prismaService.repost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!repost) {
      throw new NotFoundException('Repost not found');
    }

    await this.prismaService.repost.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    return { message: 'Repost deleted successfully' };
  }

  async getReposts(postId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reposts, total] = await Promise.all([
      this.prismaService.repost.findMany({
        where: { postId },
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.repost.count({ where: { postId } }),
    ]);

    return {
      reposts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async hasReposted(userId: string, postId: string) {
    const repost = await this.prismaService.repost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
    return { reposted: !!repost };
  }
}
