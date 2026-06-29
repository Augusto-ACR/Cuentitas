import { Controller, Post, Get, Body, Res, HttpCode } from '@nestjs/common';
import { Response } from 'express';
import { IsString, IsNotEmpty } from 'class-validator';
import { AuthService } from './auth.service';
import { SkipAuth, UsuarioId } from '../../common/decorators';

class LoginDto {
  @IsString() @IsNotEmpty() username: string;
  @IsString() @IsNotEmpty() password: string;
}

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @SkipAuth()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { token, usuario } = await this.auth.login(dto.username, dto.password);
    res.cookie('token', token, COOKIE_OPTS);
    return { usuario };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', { path: '/' });
    return { ok: true };
  }

  @Get('me')
  me(@UsuarioId() id: number) {
    return this.auth.me(id);
  }
}
