import type { PrismaClient } from './generado/client'
import type { UsuarioModel as FilaUsuario } from './generado/models'
import { esRolUsuario, type Usuario, type UsuarioNuevo } from '../../dominio/modelo/Usuario'
import type { UsuarioDAO } from '../../dominio/puertos'

/**
 * Traduce una fila de la tabla `Usuario` a la entidad del dominio. Descarta `creadoEn`, que
 * existe en la tabla pero no en el dominio.
 *
 * SQL Server no tiene enums en Prisma: `rol` llega como texto libre y se comprueba aquí, antes
 * de entrar al dominio como `RolUsuario`.
 *
 * @param fila Registro leído con Prisma.
 * @returns El usuario del dominio.
 * @throws {Error} Si la columna `rol` trae un valor que el dominio no conoce.
 */
const aDominio = (fila: FilaUsuario): Usuario => {
  if (!esRolUsuario(fila.rol)) throw new Error(`Rol de usuario desconocido: ${fila.rol}`)
  return {
    id: fila.id,
    nombre: fila.nombre,
    correo: fila.correo,
    claveHash: fila.claveHash,
    rol: fila.rol,
    barberiaId: fila.barberiaId,
    activo: fila.activo,
  }
}

/**
 * Adaptador de persistencia: implementa `UsuarioDAO` con Prisma sobre SQL Server. Es la bisagra
 * entre el ORM y el negocio: nada fuera de este archivo ve una fila de la tabla.
 */
export class UsuarioDAOPrisma implements UsuarioDAO {
  /**
   * @param prisma Cliente de Prisma. Se recibe por constructor, no se importa, para poder
   *   inyectar otro en pruebas de integración.
   */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Inserta el usuario; la base de datos asigna el UUID y `creadoEn`.
   *
   * @param usuario Datos completos, sin id, con la clave ya convertida en hash.
   * @returns El usuario guardado.
   * @throws Error de Prisma (P2003) si `barberiaId` no corresponde a una barbería existente.
   */
  async guardar(usuario: UsuarioNuevo): Promise<Usuario> {
    return aDominio(await this.prisma.usuario.create({ data: usuario }))
  }

  /**
   * Busca por la llave primaria.
   *
   * @param id Identificador del usuario.
   * @returns El usuario, o `null` si no existe.
   */
  async porId(id: string): Promise<Usuario | null> {
    const fila = await this.prisma.usuario.findUnique({ where: { id } })
    return fila && aDominio(fila)
  }

  /**
   * Busca por el índice único de `correo`.
   *
   * @param correo Correo ya normalizado en minúsculas.
   * @returns El usuario, o `null` si ninguno usa ese correo.
   */
  async porCorreo(correo: string): Promise<Usuario | null> {
    const fila = await this.prisma.usuario.findUnique({ where: { correo } })
    return fila && aDominio(fila)
  }
}
