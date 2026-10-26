import type { PrismaClient } from './generado/client'
import type { ServicioModel as FilaServicio } from './generado/models'
import type { CambiosServicio, Servicio, ServicioNuevo } from '../../dominio/modelo/Servicio'
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
   * Actualiza por id y barbería para aplicar el aislamiento multiempresa en la propia escritura. La
   * descripción solo se escribe si viene; en `null`, la columna conserva su valor (D-05).
   *
   * @param id Identificador del servicio.
   * @param barberiaId Barbería dueña del catálogo.
   * @param cambios Datos editables, ya normalizados.
   * @returns El servicio actualizado, o `null` si esa barbería no tiene un servicio con ese id.
   */
  async actualizar(id: string, barberiaId: string, cambios: CambiosServicio): Promise<Servicio | null> {
    const { descripcion, ...resto } = cambios
    const data = descripcion === null ? resto : { ...resto, descripcion }
    const resultado = await this.prisma.servicio.updateMany({ where: { id, barberiaId }, data })
    if (resultado.count === 0) return null
    const fila = await this.prisma.servicio.findUnique({ where: { id } })
    return fila ? aDominio(fila) : null
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

  /**
   * Trae todos los servicios de la barbería, sin filtrar por `activo`.
   *
   * @param barberiaId Barbería dueña del catálogo.
   * @returns Los servicios activos e inactivos, ordenados por nombre.
   */
  async deBarberia(barberiaId: string): Promise<Servicio[]> {
    const filas = await this.prisma.servicio.findMany({ where: { barberiaId }, orderBy: { nombre: 'asc' } })
    return filas.map(aDominio)
  }

  /**
   * Busca por id y barbería en la misma consulta: un servicio de otra barbería no se encuentra.
   *
   * @param barberiaId Barbería dueña del catálogo.
   * @param id Identificador del servicio.
   * @returns El servicio, o `null` si esa barbería no tiene un servicio con ese id.
   */
  async porId(barberiaId: string, id: string): Promise<Servicio | null> {
    const fila = await this.prisma.servicio.findFirst({ where: { id, barberiaId } })
    return fila && aDominio(fila)
  }

  /**
   * Cambia solo la columna `activo`; el servicio nunca se borra.
   *
   * @param id Identificador de un servicio que ya existe.
   * @param activo Estado de destino.
   * @returns El servicio con el estado nuevo.
   * @throws Error de Prisma (P2025) si el servicio no existe; el caso de uso lo comprueba antes.
   */
  async cambiarEstado(id: string, activo: boolean): Promise<Servicio> {
    return aDominio(await this.prisma.servicio.update({ where: { id }, data: { activo } }))
  }
  // En src/infraestructura/persistencia/ServicioDAOPrisma.ts

async porId(id: string): Promise<Servicio | null> {
    const fila = await this.prisma.servicio.findUnique({
      where: { id },
    });
    return fila ? aDominio(fila) : null;
  }

  async deBarbero(barberoId: string): Promise<Servicio[]> {
    const relaciones = await this.prisma.barberoServicio.findMany({
      where: {
        barberoId: barberoId,
        activo: true,
      },
      include: {
        servicio: true,
      },
    });

    return relaciones.map((r) => aDominio(r.servicio));
  }

  async asignarABarbero(barberoId: string, servicioIds: string[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Desvincular todo lo actual (soft delete)
      await tx.barberoServicio.updateMany({
        where: { barberoId },
        data: { activo: false },
      });

      // 2. Insertar o reactivar las nuevas asignaciones
      for (const servicioId of servicioIds) {
        await tx.barberoServicio.upsert({
          where: {
            barberoId_servicioId: {
              barberoId,
              servicioId,
            },
          },
          update: {
            activo: true,
          },
          create: {
            barberoId,
            servicioId,
            activo: true,
          },
        });
      }
    });
  }
}