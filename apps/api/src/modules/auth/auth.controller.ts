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
  // Secure solo cuando servimos detrás de un dominio con HTTPS (DOMINIO seteado).
  // Sin dominio (prueba por http://IP:8080) la cookie no debe ser Secure o el
  // navegador no la guarda y el login queda en loop.
  secure: !!process.env.DOMINIO,
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
    // La web usa la cookie httpOnly (ignora el token del body). Los clientes que no son
    // navegador (app móvil) guardan este `token` y lo mandan como Authorization: Bearer.
    res.cookie('token', token, COOKIE_OPTS);
    return { usuario, token };
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

  @Post('cambiar-password')
  @HttpCode(200)
  cambiarPassword(@UsuarioId() id: number, @Body() body: { actual: string; nueva: string }) {
    return this.auth.cambiarPassword(id, body.actual, body.nueva);
  }
}
