import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string[]>();

  constructor(private readonly prismaService: PrismaService) {}

  handleConnection(client: Socket) {
    const userId: string | undefined = client.handshake.auth?.userId;
    if (userId) {
      (client as any).userId = userId;
      const sockets = this.userSockets.get(userId) || [];
      sockets.push(client.id);
      this.userSockets.set(userId, sockets);
      client.join(`user:${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId || client.handshake.auth?.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId) || [];
      const index = sockets.indexOf(client.id);
      if (index > -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        } else {
          this.userSockets.set(userId, sockets);
        }
      }
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    const userId = (client as any).userId || client.handshake.auth?.userId;
    if (!userId) return;

    // Verify user is participant of conversation
    const conversation = await this.prismaService.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) return;
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return;
    }

    client.join(`conversation:${conversationId}`);
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    client.leave(`conversation:${conversationId}`);
  }

  broadcastToConversation(conversationId: string, message: any) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('newMessage', message);
  }

  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }
}
