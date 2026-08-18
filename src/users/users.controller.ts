import {
  Body,
  Controller,
  Get,
  Patch,
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
}
