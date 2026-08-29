import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Body,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { RepostsService } from './reposts.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { currentUser } from 'src/auth/decorators/current-user.decorator';
import { UserResponseDto } from 'src/users/dtos/user-response.dto';
import { CreateRepostDto } from './dtos/create-repost.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('reposts')
@UseGuards(JwtAuthGuard)
export class RepostsController {
  constructor(private readonly repostsService: RepostsService) {}

  @Throttle({ short: { ttl: 60000, limit: 20 } })
  @Post(':postId')
  createRepost(
    @currentUser() user: UserResponseDto,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: CreateRepostDto,
  ) {
    return this.repostsService.createRepost(user.id, postId, dto.content);
  }

  @Delete(':postId')
  deleteRepost(
    @currentUser() user: UserResponseDto,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.repostsService.deleteRepost(user.id, postId);
  }

  @Get(':postId')
  getReposts(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.repostsService.getReposts(postId, page, limit);
  }

  @Get(':postId/check')
  hasReposted(
    @currentUser() user: UserResponseDto,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.repostsService.hasReposted(user.id, postId);
  }
}
