import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationType } from 'generated/prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, type: NotificationType, senderId?: string, content?: string) {
    if (userId === senderId) return null;

    return this.prisma.notification.create({
      data: {
        userId,
        type,
        senderId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            headline: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        include: {
          sender: {
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
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async delete(userId: string, notificationId: string) {
    return this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }
}
