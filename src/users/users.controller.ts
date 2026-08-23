import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { currentUser } from 'src/auth/decorators/current-user.decorator';
import { UserResponseDto } from './dtos/user-response.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@currentUser() user: UserResponseDto) {
    return user;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'coverPhoto', maxCount: 1 },
      { name: 'resume', maxCount: 1 },
    ]),
  )
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @currentUser() user: UserResponseDto,
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
      resume?: Express.Multer.File[];
    },
  ) {
    return this.usersService.updateProfile(user, dto, files);
  }

  @Get('follow-suggestions')
  @UseGuards(JwtAuthGuard)
  getFollowSuggestions(@currentUser() currentUser: UserResponseDto) {
    return this.usersService.getFollowSuggestions(currentUser.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return new UserResponseDto(user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteUser(
    @Param('id') id: string,
    @currentUser() user: UserResponseDto,
  ) {
    if (id !== user.id) {
      throw new ForbiddenException(
        'You are not authorized to delete this user',
      );
    }

    await this.usersService.delete(id);
    return { message: `User with id ${id} deleted successfully` };
  }
  @Post(':userId/follow')
  @UseGuards(JwtAuthGuard)
  followUser(
    @Param('userId') userId: string,
    @currentUser() currentUser: UserResponseDto,
  ) {
    if (currentUser.id === userId) {
      throw new BadRequestException("you can't follow yourself");
    }
    return this.usersService.follow(currentUser.id, userId);
  }

  @Post(':userId/connect')
  @UseGuards(JwtAuthGuard)
  connect(
    @Param('userId') userId: string,
    @currentUser() currentUser: UserResponseDto,
  ) {
    if (currentUser.id === userId) {
      throw new BadRequestException("you can't connect with yourself");
    }
    return this.usersService.connect(currentUser.id, userId);
  }

  @Get(':userId/connectionRequests')
  @UseGuards(JwtAuthGuard)
  getConnectionRequests(
    @Param('userId') userId: string,
    @currentUser() currentUser: UserResponseDto,
  ) {
    if (currentUser.id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to get connection requests for this user',
      );
    }
    return this.usersService.getConnectionRequests(userId);
  }

  @Post(':userId/accept')
  @UseGuards(JwtAuthGuard)
  acceptRequest(
    @Param('userId') userId: string,
    @currentUser() currentUser: UserResponseDto,
  ) {
    if (currentUser.id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to accept connection requests for this user',
      );
    }
    return this.usersService.acceptRequest(userId, currentUser.id);
  }
  @Post(':userId/reject')
  @UseGuards(JwtAuthGuard)
  rejectRequest(
    @Param('userId') userId: string,
    @currentUser() currentUser: UserResponseDto,
  ) {
    if (currentUser.id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to reject connection requests for this user',
      );
    }
    return this.usersService.rejectRequest(userId, currentUser.id);
  }

  @Get(':userId/connections')
  @UseGuards(JwtAuthGuard)
  getConnections(@Param('userId') userId: string) {
    return this.usersService.getConnections(userId);
  }

  @Get(':userId/followers')
  @UseGuards(JwtAuthGuard)
  getFollowers(@Param('userId') userId: string) {
    return this.usersService.getFollowers(userId);
  }

  @Get(':userId/following')
  @UseGuards(JwtAuthGuard)
  getFollowing(@Param('userId') userId: string) {
    return this.usersService.getFollowing(userId);
  }
}
