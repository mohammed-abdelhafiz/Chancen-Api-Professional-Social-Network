import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { Prisma } from 'generated/prisma/client';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationsService: NotificationsService,
  ) {}
  findByEmail(email: string) {
    return this.prismaService.user.findUnique({ where: { email } });
  }
  findById(id: string) {
    return this.prismaService.user.findUnique({ where: { id } });
  }

  create(user: Prisma.UserCreateInput) {
    return this.prismaService.user.create({ data: user });
  }

  delete(userId: string) {
    return this.prismaService.user.delete({
      where: {
        id: userId,
      },
    });
  }

  addGoogleId(userId: string, googleId: string) {
    return this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        googleId,
      },
    });
  }
  async updateProfile(
    user: UserResponseDto,
    dto: UpdateProfileDto,
    files: {
      avatar?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
      resume?: Express.Multer.File[];
    },
  ) {
    const data: Prisma.UserUpdateInput = {
      ...dto,
    };

    if (files.avatar?.[0]) {
      const oldAvatar = user?.avatar as {
        url?: string;
        publicId?: string;
        resourceType?: 'image' | 'raw';
      };

      if (oldAvatar?.publicId) {
        await this.cloudinaryService.deleteFile(
          oldAvatar.publicId,
          oldAvatar.resourceType ?? 'image',
        );
      }
      const result = await this.cloudinaryService.uploadFile(
        files.avatar[0],
        'chancen/users/avatars',
        'image',
      );

      data.avatar = {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
      };
    }

    if (files.coverPhoto?.[0]) {
      const oldCoverPhoto = user?.coverPhoto as {
        url?: string;
        publicId?: string;
        resourceType?: 'image' | 'raw';
      };

      if (oldCoverPhoto?.publicId) {
        await this.cloudinaryService.deleteFile(
          oldCoverPhoto.publicId,
          oldCoverPhoto.resourceType ?? 'image',
        );
      }
      const result = await this.cloudinaryService.uploadFile(
        files.coverPhoto[0],
        'chancen/users/covers',
        'image',
      );

      data.coverPhoto = {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
      };
    }

    if (files.resume?.[0]) {
      const oldResume = user?.resume as {
        url?: string;
        publicId?: string;
        resourceType?: 'image' | 'raw';
      };

      if (oldResume?.publicId) {
        await this.cloudinaryService.deleteFile(
          oldResume.publicId,
          oldResume.resourceType ?? 'image',
        );
      }
      const result = await this.cloudinaryService.uploadFile(
        files.resume[0],
        'chancen/users/resumes',
        'image',
      );
      data.resume = {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
      };
    }

    const updatedUser = await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data,
    });
    return new UserResponseDto(updatedUser);
  }
  async follow(currentUserId: string, targetUserId: string) {
    const follow = await this.prismaService.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    if (follow) {
      await this.prismaService.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
      });

      return {
        message: 'Unfollowed successfully',
      };
    }

    await this.prismaService.follow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });

    await this.notificationsService.create(
      targetUserId,
      NotificationType.follow,
      currentUserId,
      'started following you',
    );

    return {
      message: 'Followed successfully',
    };
  }
  async connect(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('You cannot connect with yourself');
    }

    const connection = await this.prismaService.connection.findFirst({
      where: {
        OR: [
          {
            senderId: currentUserId,
            receiverId: targetUserId,
          },
          {
            senderId: targetUserId,
            receiverId: currentUserId,
          },
        ],
      },
    });

    if (!connection) {
      await this.prismaService.connection.create({
        data: {
          senderId: currentUserId,
          receiverId: targetUserId,
        },
      });

      await this.notificationsService.create(
        targetUserId,
        NotificationType.connection_request,
        currentUserId,
        'sent you a connection request',
      );

      return {
        message: 'Connection request sent successfully',
      };
    }

    // Current user sent the request
    if (
      connection.senderId === currentUserId &&
      connection.receiverId === targetUserId
    ) {
      if (connection.status === 'pending') {
        await this.prismaService.connection.delete({
          where: {
            senderId_receiverId: {
              senderId: currentUserId,
              receiverId: targetUserId,
            },
          },
        });

        return {
          message: 'Connection request cancelled successfully',
        };
      }

      if (connection.status === 'accepted') {
        return {
          message: 'You are already connected',
        };
      }
    }

    // Target user already sent a request
    if (
      connection.senderId === targetUserId &&
      connection.receiverId === currentUserId
    ) {
      if (connection.status === 'pending') {
        await this.prismaService.connection.update({
          where: {
            senderId_receiverId: {
              senderId: targetUserId,
              receiverId: currentUserId,
            },
          },
          data: {
            status: 'accepted',
          },
        });

        return {
          message: 'Connection accepted successfully',
        };
      }

      if (connection.status === 'accepted') {
        return {
          message: 'You are already connected',
        };
      }
    }
  }
  async getConnectionRequests(userId: string) {
    return this.prismaService.connection.findMany({
      where: {
        receiverId: userId,
      },
      include: {
        sender: true,
      },
    });
  }
  async acceptRequest(userId: string, currentUserId: string) {
    const connection = await this.prismaService.connection.findUnique({
      where: {
        senderId_receiverId: {
          senderId: userId,
          receiverId: currentUserId,
        },
      },
    });
    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }
    await this.prismaService.connection.update({
      where: {
        senderId_receiverId: {
          senderId: userId,
          receiverId: currentUserId,
        },
      },
      data: {
        status: 'accepted',
      },
    });

    await this.notificationsService.create(
      userId,
      NotificationType.connection_accepted,
      currentUserId,
      'accepted your connection request',
    );

    return {
      message: 'Connection request accepted successfully',
    };
  }
  async rejectRequest(userId: string, currentUserId: string) {
    const connection = await this.prismaService.connection.findUnique({
      where: {
        senderId_receiverId: {
          senderId: userId,
          receiverId: currentUserId,
        },
      },
    });
    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }
    await this.prismaService.connection.delete({
      where: {
        senderId_receiverId: {
          senderId: userId,
          receiverId: currentUserId,
        },
      },
    });
    return {
      message: 'Connection request rejected successfully',
    };
  }
  async getConnections(userId: string) {
    return this.prismaService.connection.findMany({
      where: {
        receiverId: userId,
        status: 'accepted',
      },
      include: {
        sender: true,
      },
    });
  }

  async getFollowers(userId: string) {
    return this.prismaService.follow.findMany({
      where: {
        followingId: userId,
      },
      include: {
        follower: true,
      },
    });
  }

  getFollowing(userId: string) {
    return this.prismaService.follow.findMany({
      where: {
        followerId: userId,
      },
      include: {
        following: true,
      },
    });
  }

  async getFollowSuggestions(currentUserId: string) {
    const followingsIds = (
      await this.prismaService.follow.findMany({
        where: { followerId: currentUserId },
      })
    ).map((following) => following.followingId);
    return this.prismaService.user.findMany({
      where: { id: { notIn: [...followingsIds, currentUserId] } },
      take: 3,
    });
  }
}
