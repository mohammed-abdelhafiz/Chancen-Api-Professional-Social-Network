import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { currentUser } from 'src/auth/decorators/current-user.decorator';
import { UserResponseDto } from './dtos/user-response.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

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
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @currentUser() user: UserResponseDto,
  ) {
    return this.usersService.updateProfile(user, dto);
  }
}
