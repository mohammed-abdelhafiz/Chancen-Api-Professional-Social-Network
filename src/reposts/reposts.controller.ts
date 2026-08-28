import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  Body,
} from '@nestjs/common';
import { RepostsService } from './reposts.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('reposts')
@UseGuards(JwtAuthGuard)
export class RepostsController {
  constructor(private readonly repostsService: RepostsService) {}

  @Post(':postId')
  createRepost(
    @Req() req: any,
    @Param('postId') postId: string,
    @Body('content') content?: string,
  ) {
    return this.repostsService.createRepost(req.user.id, postId, content);
  }

  @Delete(':postId')
  deleteRepost(@Req() req: any, @Param('postId') postId: string) {
    return this.repostsService.deleteRepost(req.user.id, postId);
  }

  @Get(':postId')
  getReposts(
    @Param('postId') postId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.repostsService.getReposts(
      postId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':postId/check')
  hasReposted(@Req() req: any, @Param('postId') postId: string) {
    return this.repostsService.hasReposted(req.user.id, postId);
  }
}
