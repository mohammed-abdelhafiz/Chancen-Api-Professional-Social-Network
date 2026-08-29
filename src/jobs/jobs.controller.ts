import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ParseUUIDPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dtos/create-job.dto';
import { UpdateJobDto } from './dtos/update-job.dto';
import { ApplyToJobDto } from './dtos/apply-to-job.dto';
import { UpdateApplicationStatusDto } from './dtos/update-application-status.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { currentUser } from 'src/auth/decorators/current-user.decorator';
import { UserResponseDto } from 'src/users/dtos/user-response.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateJobDto, @currentUser() user: UserResponseDto) {
    return this.jobsService.create(user.id, dto);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('type') type?: string,
  ) {
    return this.jobsService.findAll(page, limit, search, type);
  }

  @Get('my-jobs')
  @UseGuards(JwtAuthGuard)
  getMyJobs(@currentUser() user: UserResponseDto) {
    return this.jobsService.getMyJobs(user.id);
  }

  @Get('my-applications')
  @UseGuards(JwtAuthGuard)
  getMyApplications(@currentUser() user: UserResponseDto) {
    return this.jobsService.getMyApplications(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobDto,
    @currentUser() user: UserResponseDto,
  ) {
    return this.jobsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUser() user: UserResponseDto,
  ) {
    return this.jobsService.remove(id, user.id);
  }

  @Throttle({ short: { ttl: 60000, limit: 20 } })
  @Post(':id/apply')
  @UseGuards(JwtAuthGuard)
  apply(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApplyToJobDto,
    @currentUser() user: UserResponseDto,
  ) {
    return this.jobsService.apply(id, user.id, dto.coverLetter);
  }

  @Get(':id/applications')
  @UseGuards(JwtAuthGuard)
  getApplications(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUser() user: UserResponseDto,
  ) {
    return this.jobsService.getApplications(id, user.id);
  }

  @Patch(':id/applications/:applicationId')
  @UseGuards(JwtAuthGuard)
  updateApplicationStatus(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: UpdateApplicationStatusDto,
    @currentUser() user: UserResponseDto,
  ) {
    return this.jobsService.updateApplicationStatus(
      jobId,
      applicationId,
      user.id,
      dto.status,
    );
  }
}
