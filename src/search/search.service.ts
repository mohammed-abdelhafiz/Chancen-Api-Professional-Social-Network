import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prismaService: PrismaService) {}

  async search(query: string, currentUserId?: string) {
    if (!query || query.trim().length === 0) {
      return { users: [], posts: [], jobs: [] };
    }

    const searchTerm = query.trim();

    const [users, posts, jobs] = await Promise.all([
      this.searchUsers(searchTerm, currentUserId),
      this.searchPosts(searchTerm),
      this.searchJobs(searchTerm),
    ]);

    return { users, posts, jobs };
  }

  private async searchUsers(query: string, currentUserId?: string) {
    return this.prismaService.user.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { headline: { contains: query, mode: 'insensitive' } },
        ],
        ...(currentUserId ? { id: { not: currentUserId } } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        headline: true,
      },
      take: 10,
    });
  }

  private async searchPosts(query: string) {
    return this.prismaService.post.findMany({
      where: {
        OR: [
          { content: { contains: query, mode: 'insensitive' } },
        ],
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
        _count: {
          select: {
            postLikes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  private async searchJobs(query: string) {
    return this.prismaService.job.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
        ],
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
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }
}
