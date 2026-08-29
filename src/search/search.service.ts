import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prismaService: PrismaService) {}

  async search(query: string, currentUserId?: string, page = 1, limit = 10) {
    if (!query || query.trim().length === 0) {
      return { users: [], posts: [], jobs: [] };
    }

    const searchTerm = query.trim();
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 20);
    const skip = (safePage - 1) * safeLimit;

    const [users, posts, jobs] = await Promise.all([
      this.searchUsers(searchTerm, currentUserId, skip, safeLimit),
      this.searchPosts(searchTerm, skip, safeLimit),
      this.searchJobs(searchTerm, skip, safeLimit),
    ]);

    return { users, posts, jobs };
  }

  private async searchUsers(
    query: string,
    currentUserId?: string,
    skip = 0,
    take = 10,
  ) {
    return this.prismaService.user.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { headline: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
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
      skip,
      take,
    });
  }

  private async searchPosts(query: string, skip = 0, take = 10) {
    return this.prismaService.post.findMany({
      where: {
        OR: [{ content: { contains: query, mode: 'insensitive' } }],
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
      skip,
      take,
    });
  }

  private async searchJobs(query: string, skip = 0, take = 10) {
    return this.prismaService.job.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          { requirements: { contains: query, mode: 'insensitive' } },
          { benefits: { contains: query, mode: 'insensitive' } },
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
      skip,
      take,
    });
  }
}
