import { Controller, Get, Query, Req, UseGuards, Optional } from '@nestjs/common';
import { SearchService } from './search.service';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  search(
    @Query('q') query: string,
    @Req() req: any,
  ) {
    return this.searchService.search(query, req.user?.id);
  }
}
