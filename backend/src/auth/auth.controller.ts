import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../common/guards/local-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GenerateApiKeyDto } from './dto/generate-api-key.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Request() req, @Body() loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('api-keys')
  @ApiOperation({ summary: 'Generate a new API key' })
  async generateApiKey(@Request() req, @Body() dto: GenerateApiKeyDto) {
    return this.authService.generateApiKey(req.user.id, dto.name);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('api-keys/:id/revoke')
  @ApiOperation({ summary: 'Revoke an API key' })
  async revokeApiKey(@Request() req, @Body('apiKeyId') apiKeyId: string) {
    return this.authService.revokeApiKey(req.user.id, apiKeyId);
  }
}
