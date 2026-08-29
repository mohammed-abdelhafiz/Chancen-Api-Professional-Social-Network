import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'generated/prisma/client';
import { MessagesGateway } from './gateways/messages.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    private readonly gateway: MessagesGateway,
  ) {}

  async getConversations(userId: string) {
    const conversations = await this.prismaService.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            headline: true,
          },
        },
        user2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            headline: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((conv) => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
      const lastMessage = conv.messages[0] || null;
      return {
        id: conv.id,
        otherUser,
        lastMessage,
        updatedAt: conv.updatedAt,
      };
    });
  }

  async getOrCreateConversation(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new ForbiddenException('Cannot create conversation with yourself');
    }

    const existing = await this.prismaService.conversation.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: otherUserId },
          { user1Id: otherUserId, user2Id: userId },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            headline: true,
          },
        },
        user2: {
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

    if (existing) {
      const otherUser =
        existing.user1Id === userId ? existing.user2 : existing.user1;
      return { id: existing.id, otherUser };
    }

    const conversation = await this.prismaService.conversation.create({
      data: {
        user1Id: userId,
        user2Id: otherUserId,
      },
      include: {
        user1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            headline: true,
          },
        },
        user2: {
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

    const otherUser =
      conversation.user1Id === userId ? conversation.user2 : conversation.user1;
    return { id: conversation.id, otherUser };
  }

  async getMessages(
    conversationId: string,
    userId: string,
    page = 1,
    limit = 50,
  ) {
    const conversation = await this.prismaService.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (safePage - 1) * safeLimit;

    const [messages, total] = await Promise.all([
      this.prismaService.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prismaService.message.count({ where: { conversationId } }),
    ]);

    const readAt = new Date();
    await this.prismaService.conversation.update({
      where: { id: conversationId },
      data:
        conversation.user1Id === userId
          ? {
              user1LastReadAt: readAt,
              // Viewing a thread should not change its message-recency ordering.
              updatedAt: conversation.updatedAt,
            }
          : {
              user2LastReadAt: readAt,
              updatedAt: conversation.updatedAt,
            },
    });

    return {
      messages: messages.reverse(),
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const conversation = await this.prismaService.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.user1Id !== senderId &&
      conversation.user2Id !== senderId
    ) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    const message = await this.prismaService.message.create({
      data: {
        content,
        conversationId,
        senderId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    await this.prismaService.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const otherUserId =
      conversation.user1Id === senderId
        ? conversation.user2Id
        : conversation.user1Id;

    try {
      const notification = await this.notificationsService.create(
        otherUserId,
        NotificationType.message,
        senderId,
        'sent you a message',
        `/messaging?conversation=${conversationId}`,
      );
      if (notification) {
        this.gateway.sendNotificationToUser(otherUserId, notification);
      }
    } catch {
      // Ignored if notification creation fails
    }

    return message;
  }

  async getUnreadCount(userId: string) {
    const conversations = await this.prismaService.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      select: {
        id: true,
        user1Id: true,
        user1LastReadAt: true,
        user2LastReadAt: true,
      },
    });

    let totalUnread = 0;

    for (const conv of conversations) {
      const lastReadAt =
        conv.user1Id === userId ? conv.user1LastReadAt : conv.user2LastReadAt;
      const unreadCount = await this.prismaService.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          ...(lastReadAt
            ? { createdAt: { gt: lastReadAt } }
            : {}),
        },
      });
      totalUnread += unreadCount;
    }

    return { unreadCount: totalUnread };
  }
}
