import type { PrismaClient } from './generado/client'
import type { ServicioModel as FilaServicio } from './generado/models'
import type { Servicio, ServicioNuevo } from '../../dominio/modelo/Servicio'
import type { ServicioDAO } from '../../dominio/puertos'

/**
 * Traduce una fila de la tabla `Servicio` a la entidad del dominio. Descarta `creadoEn`, que
 * existe en la tabla pero no en el dominio.
 *
 * @param fila Registro leído con Prisma.
 * @returns El servicio del dominio.
 */
const aDominio = (fila: FilaServicio): Servicio => ({
  id: fila.id,
  barberiaId: fila.barberiaId,
  nombre: fila.nombre,
  descripcion: fila.descripcion,
  precio: fila.precio,
  duracionMinutos: fila.duracionMinutos,
  activo: fila.activo,
})

/**
 * Adaptador de persistencia: implementa `ServicioDAO` con Prisma sobre SQL Server. Es la bisagra
 * entre el ORM y el negocio: nada fuera de este archivo ve una fila de la tabla.
 */
export class ServicioDAOPrisma implements ServicioDAO {
  /**
   * @param prisma Cliente de Prisma. Se recibe por constructor, no se importa, para poder
   *   inyectar otro en pruebas de integración.
   */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Inserta el servicio; la base de datos asigna el UUID y `creadoEn`.
   *
   * @param servicio Datos completos, sin id.
   * @returns El servicio guardado.
   */
  async guardar(servicio: ServicioNuevo): Promise<Servicio> {
    return aDominio(await this.prisma.servicio.create({ data: servicio }))
  }

  /**
   * Busca por el índice único `(barberiaId, nombre)`. La intercalación de SQL Server no distingue
   * mayúsculas: "Corte clásico" y "CORTE CLÁSICO" son el mismo nombre, que es justo lo que pide
   * la regla.
   *
   * @param barberiaId Barbería dueña del catálogo.
   * @param nombre Nombre a buscar, sin espacios en los extremos.
   * @returns El servicio, o `null` si la barbería no tiene uno con ese nombre.
   */
  async porNombre(barberiaId: string, nombre: string): Promise<Servicio | null> {
    const fila = await this.prisma.servicio.findUnique({ where: { barberiaId_nombre: { barberiaId, nombre } } })
    return fila && aDominio(fila)
  }

  /**
   * Filtra en la base de datos los servicios activos de la barbería.
   *
   * @param barberiaId Barbería dueña del catálogo.
   * @returns Los servicios activos, ordenados por nombre.
   */
  async activosDe(barberiaId: string): Promise<Servicio[]> {
    const filas = await this.prisma.servicio.findMany({
      where: { barberiaId, activo: true },
      orderBy: { nombre: 'asc' },
    })
    return filas.map(aDominio)
  }
}
