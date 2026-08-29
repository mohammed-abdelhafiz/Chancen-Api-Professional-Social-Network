import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { currentUser } from 'src/auth/decorators/current-user.decorator';
import { UserResponseDto } from 'src/users/dtos/user-response.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Throttle({ short: { ttl: 60000, limit: 15 } })
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  CreatePost(
    @Body() body: CreatePostDto,
    @UploadedFile() imageFile: Express.Multer.File,
    @currentUser() currentUser: UserResponseDto,
  ) {
    const hasContent = body.content && body.content.trim().length > 0;
    if (!hasContent && !imageFile) {
      throw new BadRequestException('content or image is required');
    }
    if (body.content) {
      body.content = body.content.trim();
    }
    return this.postsService.createPost(body, imageFile, currentUser);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  getPosts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @currentUser() user: UserResponseDto | null,
  ) {
    return this.postsService.getPosts(page, limit, user?.id);
  }

  @Get('user/:userId')
  @UseGuards(OptionalJwtAuthGuard)
  getPostsByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @currentUser() user: UserResponseDto | null,
  ) {
    return this.postsService.getPostsByUser(userId, page, limit, user?.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getPostById(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUser() user: UserResponseDto | null,
  ) {
    return this.postsService.getPostById(id, user?.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  updatePost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostDto,
    @UploadedFile() imageFile: Express.Multer.File,
    @currentUser() user: UserResponseDto,
  ) {
    return this.postsService.updatePost(id, user.id, dto, imageFile);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  toggleLike(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUser() user: UserResponseDto,
  ) {
    return this.postsService.toggleLike(id, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deletePost(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUser() user: UserResponseDto,
  ) {
    return this.postsService.deletePost(id, user.id);
  }

  @Throttle({ short: { ttl: 60000, limit: 30 } })
  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  createComment(
    @Param('id', ParseUUIDPipe) postId: string,
    @Body() dto: CreateCommentDto,
    @UploadedFile() imageFile: Express.Multer.File,
    @currentUser() user: UserResponseDto,
  ) {
    return this.postsService.createComment(postId, dto, imageFile, user.id);
  }

  @Get(':id/comments')
  @UseGuards(OptionalJwtAuthGuard)
  getComments(
    @Param('id', ParseUUIDPipe) postId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @currentUser() user: UserResponseDto | null,
  ) {
    return this.postsService.getComments(postId, page, limit, user?.id);
  }

  @Post('comments/:commentId/like')
  @UseGuards(JwtAuthGuard)
  toggleCommentLike(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @currentUser() user: UserResponseDto,
  ) {
    return this.postsService.toggleCommentLike(commentId, user.id);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  deleteComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @currentUser() user: UserResponseDto,
  ) {
    return this.postsService.deleteComment(commentId, user.id);
  }
}
