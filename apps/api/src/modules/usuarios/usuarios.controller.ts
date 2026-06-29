import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { UsuariosService } from './usuarios.service';
import { AdminOnly, UsuarioId } from '../../common/decorators';

class CrearUsuarioDto {
  @IsString() @IsNotEmpty() username: string;
  @IsString() @IsNotEmpty() nombre: string;
  @IsString() @IsNotEmpty() password: string;
  @IsOptional() @IsIn(['admin', 'miembro']) rol?: 'admin' | 'miembro';
}

class ResetPasswordDto {
  @IsString() @IsNotEmpty() password: string;
}

class PreferenciasDto {
  @IsIn(['oficial', 'mep', 'blue']) dolarPref: string;
}

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly svc: UsuariosService) {}

  // Lista mínima para elegir participantes (todos los usuarios autenticados)
  @Get('familia')
  familia() {
    return this.svc.familia();
  }

  @AdminOnly()
  @Get()
  listar() {
    return this.svc.listar();
  }

  @AdminOnly()
  @Post()
  crear(@Body() dto: CrearUsuarioDto) {
    return this.svc.crear(dto);
  }

  @AdminOnly()
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.svc.eliminar(id);
  }

  @AdminOnly()
  @Post(':id/reset-password')
  resetPassword(@Param('id', ParseIntPipe) id: number, @Body() dto: ResetPasswordDto) {
    return this.svc.resetPassword(id, dto.password);
  }

  @Patch('preferencias')
  preferencias(@UsuarioId() id: number, @Body() dto: PreferenciasDto) {
    return this.svc.actualizarPreferencias(id, dto.dolarPref);
  }
}
