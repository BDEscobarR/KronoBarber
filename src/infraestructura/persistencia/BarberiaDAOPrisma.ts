import type { PrismaClient } from './generado/client'
import type { BarberiaModel as FilaBarberia } from './generado/models'
import { esEstadoBarberia, type Barberia, type BarberiaNueva, type EstadoBarberia } from '../../dominio/modelo/Barberia'
import type { BarberiaDAO } from '../../dominio/puertos'

/**
 * Traduce una fila de la tabla `Barberia` a la entidad del dominio. Descarta `creadoEn`, que
 * existe en la tabla pero no en el dominio.
 *
 * SQL Server no tiene enums en Prisma: `estado` llega como texto libre y se comprueba aquí,
 * antes de entrar al dominio como `EstadoBarberia`.
 *
 * @param fila Registro leído con Prisma.
 * @returns La barbería del dominio.
 * @throws {Error} Si la columna `estado` trae un valor que el dominio no conoce.
 */
const aDominio = (fila: FilaBarberia): Barberia => {
  if (!esEstadoBarberia(fila.estado)) throw new Error(`Estado de barbería desconocido: ${fila.estado}`)
  return {
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    direccion: fila.direccion,
    ciudad: fila.ciudad,
    telefono: fila.telefono,
    correo: fila.correo,
    estado: fila.estado,
    motivoSuspension: fila.motivoSuspension,
  }
}

/**
 * Adaptador de persistencia: implementa `BarberiaDAO` con Prisma sobre SQL Server. Es la bisagra
 * entre el ORM y el negocio: nada fuera de este archivo ve una fila de la tabla.
 */
export class BarberiaDAOPrisma implements BarberiaDAO {
  /**
   * @param prisma Cliente de Prisma. Se recibe por constructor, no se importa, para poder
   *   inyectar otro en pruebas de integración.
   */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Inserta la barbería; la base de datos asigna el UUID y `creadoEn`.
   *
   * @param barberia Datos completos, sin id.
   * @returns La barbería guardada.
   */
  async guardar(barberia: BarberiaNueva): Promise<Barberia> {
    return aDominio(await this.prisma.barberia.create({ data: barberia }))
  }

  /**
   * Busca por la llave primaria.
   *
   * @param id Identificador de la barbería.
   * @returns La barbería, o `null` si no existe.
   */
  async porId(id: string): Promise<Barberia | null> {
    const fila = await this.prisma.barberia.findUnique({ where: { id } })
    return fila && aDominio(fila)
  }

  /**
   * Busca por el índice único de `correo`.
   *
   * @param correo Correo ya normalizado en minúsculas.
   * @returns La barbería, o `null` si ninguna usa ese correo.
   */
  async porCorreo(correo: string): Promise<Barberia | null> {
    const fila = await this.prisma.barberia.findUnique({ where: { correo } })
    return fila && aDominio(fila)
  }

  /**
   * Filtra en la base de datos por estado y, si se pide, por ciudad. La intercalación de SQL
   * Server no distingue mayúsculas, así que "manizales" encuentra "Manizales".
   *
   * @param ciudad Ciudad por la que filtrar, o `null` para no filtrar.
   * @returns Las barberías habilitadas, ordenadas por nombre.
   */
  async habilitadas(ciudad: string | null): Promise<Barberia[]> {
    const filas = await this.prisma.barberia.findMany({
      where: { estado: 'HABILITADA', ...(ciudad === null ? {} : { ciudad }) },
      orderBy: { nombre: 'asc' },
    })
    return filas.map(aDominio)
  }

  /**
   * Actualiza el estado y el motivo de suspensión en una sola sentencia.
   *
   * @param id Identificador de una barbería que ya existe.
   * @param estado Estado de destino.
   * @param motivoSuspension Motivo si el destino es SUSPENDIDA; `null` en cualquier otro caso.
   * @returns La barbería con el estado nuevo.
   * @throws Error de Prisma (P2025) si la barbería no existe; el caso de uso lo comprueba antes.
   */
  async cambiarEstado(id: string, estado: EstadoBarberia, motivoSuspension: string | null): Promise<Barberia> {
    return aDominio(await this.prisma.barberia.update({ where: { id }, data: { estado, motivoSuspension } }))
  }
}
