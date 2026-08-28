import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreatePostDto } from './dtos/create-post.dto';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UserResponseDto } from 'src/users/dtos/user-response.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'generated/prisma/client';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'generated/prisma/client';

@Injectable()
export class PostsService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly prismaService: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}
  async createPost(
    body: CreatePostDto,
    imageFile: Express.Multer.File,
    currentUser: UserResponseDto,
  ) {
    const data: Prisma.PostUncheckedCreateInput = {
      ...body,
      userId: currentUser.id,
    };
    if (imageFile) {
      const result = await this.cloudinaryService.uploadFile(
        imageFile,
        'chancen/posts',
        'image',
      );
      data.image = {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
      };
    }
    return this.prismaService.post.create({
      data,
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
    });
  }

  async getPosts(page: number, limit: number, currentUserId?: string) {
    const safePage = Math.max(1, Math.floor(page) || 1);
    const safeLimit = Math.min(Math.max(1, Math.floor(limit) || 10), 50);
    const posts = await this.prismaService.post.findMany({
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      orderBy: {
        createdAt: 'desc',
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
        ...(currentUserId
          ? {
              postLikes: {
                where: { userId: currentUserId },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    const mapped = posts.map((post: any) => ({
      ...post,
      isLiked: currentUserId ? post.postLikes?.length > 0 : false,
      postLikes: undefined,
    }));

    return {
      posts: mapped,
      nextPage: posts.length === safeLimit ? safePage + 1 : undefined,
    };
  }

  async toggleLike(postId: string, userId: string) {
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.prismaService.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existing) {
      await this.prismaService.postLike.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
      const count = await this.prismaService.postLike.count({
        where: { postId },
      });
      return { liked: false, likesCount: count, message: 'Post unliked' };
    }

    await this.prismaService.postLike.create({
      data: {
        postId,
        userId,
      },
    });
    const count = await this.prismaService.postLike.count({
      where: { postId },
    });

    await this.notificationsService.create(
      post.userId,
      NotificationType.like,
      userId,
      'liked your post',
    );

    return { liked: true, likesCount: count, message: 'Post liked' };
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.userId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this post');
    }

    const image = post.image as { publicId?: string; resourceType?: string } | null;
    if (image?.publicId) {
      try {
        await this.cloudinaryService.deleteFile(
          image.publicId,
          (image.resourceType as 'image' | 'raw') || 'image',
        );
      } catch {}
    }

    await this.prismaService.post.delete({
      where: { id: postId },
    });
    return { message: 'Post deleted successfully' };
  }

  async createComment(
    postId: string,
    dto: CreateCommentDto,
    imageFile: Express.Multer.File | undefined,
    userId: string,
  ) {
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const hasContent = dto.content && dto.content.trim().length > 0;
    if (!hasContent && !imageFile) {
      throw new BadRequestException('content or image is required');
    }

    const data: Prisma.CommentUncheckedCreateInput = {
      content: dto.content?.trim() || '',
      postId,
      userId,
    };

    if (imageFile) {
      const result = await this.cloudinaryService.uploadFile(
        imageFile,
        'chancen/comments',
        'image',
      );
      data.image = {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
      };
    }

    // Ensure content is not empty if no image (already validated)
    if (!data.content && !imageFile) {
      data.content = '';
    }

    const comment = await this.prismaService.comment.create({
      data,
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
            commentLikes: true,
          },
        },
      },
    });

    await this.notificationsService.create(
      post.userId,
      NotificationType.comment,
      userId,
      'commented on your post',
    );

    return comment;
  }

  async getComments(
    postId: string,
    page: number,
    limit: number,
    currentUserId?: string,
  ) {
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const safePage = Math.max(1, Math.floor(page) || 1);
    const safeLimit = Math.min(Math.max(1, Math.floor(limit) || 10), 50);

    const comments = await this.prismaService.comment.findMany({
      where: { postId },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      orderBy: { createdAt: 'asc' },
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
            commentLikes: true,
          },
        },
        ...(currentUserId
          ? {
              commentLikes: {
                where: { userId: currentUserId },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    const mapped = comments.map((c: any) => ({
      ...c,
      isLiked: currentUserId ? c.commentLikes?.length > 0 : false,
      commentLikes: undefined,
    }));

    return {
      comments: mapped,
      nextPage: comments.length === safeLimit ? safePage + 1 : undefined,
    };
  }

  async toggleCommentLike(commentId: string, userId: string) {
    const comment = await this.prismaService.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const existing = await this.prismaService.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (existing) {
      await this.prismaService.commentLike.delete({
        where: {
          commentId_userId: {
            commentId,
            userId,
          },
        },
      });
      const count = await this.prismaService.commentLike.count({
        where: { commentId },
      });
      return { liked: false, likesCount: count, message: 'Comment unliked' };
    }

    await this.prismaService.commentLike.create({
      data: {
        commentId,
        userId,
      },
    });
    const count = await this.prismaService.commentLike.count({
      where: { commentId },
    });
    return { liked: true, likesCount: count, message: 'Comment liked' };
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prismaService.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this comment');
    }
    const image = comment.image as { publicId?: string; resourceType?: string } | null;
    if (image?.publicId) {
      try {
        await this.cloudinaryService.deleteFile(
          image.publicId,
          (image.resourceType as 'image' | 'raw') || 'image',
        );
      } catch {}
    }
    await this.prismaService.comment.delete({
      where: { id: commentId },
    });
    return { message: 'Comment deleted successfully' };
  }
}

