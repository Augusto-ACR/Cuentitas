import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { CategoriasService } from './categorias.service';
import { UsuarioId } from '../../common/decorators';

class CrearCatDto {
  @IsString() @IsNotEmpty() slug: string;
  @IsString() @IsNotEmpty() color: string;
  @IsString() @IsNotEmpty() label: string;
  @IsOptional() @IsArray() matches?: string[];
}

@Controller('categorias')
export class CategoriasController {
  constructor(private readonly svc: CategoriasService) {}

  @Get()
  listar(@UsuarioId() id: number) {
    return this.svc.listar(id);
  }

  @Post()
  crear(@UsuarioId() id: number, @Body() dto: CrearCatDto) {
    return this.svc.crear(id, dto);
  }

  @Patch(':id')
  actualizar(@UsuarioId() uid: number, @Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CrearCatDto>) {
    return this.svc.actualizar(uid, id, dto);
  }

  @Delete(':id')
  eliminar(@UsuarioId() uid: number, @Param('id', ParseIntPipe) id: number) {
    return this.svc.eliminar(uid, id);
  }
}
