// src/infraestructura/persistencia/UsuarioDAOPrisma.ts
import type { PrismaClient } from './generado/client';
import type { UsuarioDAO } from '../../dominio/puertos';
import type { Usuario, UsuarioNuevo } from '../../dominio/modelo/Usuario';
import { esRolUsuario } from '../../dominio/modelo/Usuario';

export class UsuarioDAOPrisma implements UsuarioDAO {
  constructor(private readonly prisma: PrismaClient) {}

  async guardar(datos: UsuarioNuevo): Promise<Usuario> {
    const creado = await this.prisma.usuario.create({
      data: {
        nombre: datos.nombre,
        correo: datos.correo,
        claveHash: datos.claveHash,
        rol: datos.rol,
        barberiaId: datos.barberiaId,
      },
    });

    return this.aDominio(creado);
  }

  async porId(id: string): Promise<Usuario | null> {
    const registro = await this.prisma.usuario.findUnique({ where: { id } });
    return registro ? this.aDominio(registro) : null;
  }

  async porCorreo(correo: string): Promise<Usuario | null> {
    const registro = await this.prisma.usuario.findUnique({ where: { correo } });
    return registro ? this.aDominio(registro) : null;
  }

  private aDominio(registro: { id: string; nombre: string; correo: string; claveHash: string; rol: string; barberiaId: string | null; creadoEn: Date }): Usuario {
    if (!esRolUsuario(registro.rol)) {
      throw new Error(`Rol inválido en la base de datos: ${registro.rol}`);
    }

    return {
      id: registro.id,
      nombre: registro.nombre,
      correo: registro.correo,
      claveHash: registro.claveHash,
      rol: registro.rol,
      barberiaId: registro.barberiaId,
      creadoEn: registro.creadoEn,
    };
  }
}