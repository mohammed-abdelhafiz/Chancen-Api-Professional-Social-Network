import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { currentUser } from 'src/auth/decorators/current-user.decorator';
import { UserResponseDto } from 'src/users/dtos/user-response.dto';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post(':postId/toggle')
  toggleBookmark(
    @currentUser() user: UserResponseDto,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.bookmarksService.toggleBookmark(user.id, postId);
  }

  @Get()
  getBookmarks(
    @currentUser() user: UserResponseDto,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.bookmarksService.getBookmarks(user.id, page, limit);
  }

  @Get(':postId/check')
  isBookmarked(
    @currentUser() user: UserResponseDto,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.bookmarksService.isBookmarked(user.id, postId);
  }
}
