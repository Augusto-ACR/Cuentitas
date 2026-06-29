import {
  Controller, Get, Post, Body, Res, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ImportExportService } from './import-export.service';
import { UsuarioId } from '../../common/decorators';

@Controller()
export class ImportExportController {
  constructor(private readonly svc: ImportExportService) {}

  @Get('import/plantilla.xlsx')
  async plantilla(@Res() res: Response) {
    const buf = await this.svc.plantillaBuffer();
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="plantilla-cuentitas.xlsx"' });
    res.send(buf);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  preview(@UsuarioId() uid: number, @UploadedFile() file: Express.Multer.File) {
    return this.svc.preview(uid, file.buffer);
  }

  @Post('import/confirmar')
  confirmar(@UsuarioId() uid: number, @Body() body: { items: any[] }) {
    return this.svc.confirmar(uid, body.items);
  }

  @Get('export.xlsx')
  async exportar(@UsuarioId() uid: number, @Res() res: Response) {
    const buf = await this.svc.exportar(uid);
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="cuentitas-backup.xlsx"' });
    res.send(buf);
  }
}
