import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post(':postId/toggle')
  toggleBookmark(@Req() req: any, @Param('postId') postId: string) {
    return this.bookmarksService.toggleBookmark(req.user.id, postId);
  }

  @Get()
  getBookmarks(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookmarksService.getBookmarks(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':postId/check')
  isBookmarked(@Req() req: any, @Param('postId') postId: string) {
    return this.bookmarksService.isBookmarked(req.user.id, postId);
  }
}
