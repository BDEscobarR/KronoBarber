import type { PrismaClient } from './generado/client'
import type { AusenciaModel as FilaAusencia } from './generado/models'
import { esTipoAusencia, type Ausencia, type AusenciaNueva, type CambiosAusencia } from '../../dominio/modelo/Ausencia'
import type { AusenciaDAO } from '../../dominio/puertos'

/**
 * Traduce una fila de la tabla `Ausencia` a la entidad del dominio. Descarta `creadoEn`, que existe en
 * la tabla pero no en el dominio.
 *
 * SQL Server no tiene enums en Prisma: `tipo` llega como texto libre y se comprueba aquí, antes de
 * entrar al dominio como `TipoAusencia`.
 *
 * @param fila Registro leído con Prisma.
 * @returns La ausencia del dominio.
 * @throws {Error} Si la columna `tipo` trae un valor que el dominio no conoce.
 */
const aDominio = (fila: FilaAusencia): Ausencia => {
  if (!esTipoAusencia(fila.tipo)) throw new Error(`Tipo de ausencia desconocido: ${fila.tipo}`)
  return {
    id: fila.id,
    barberoId: fila.barberoId,
    tipo: fila.tipo,
    desde: fila.desde,
    hasta: fila.hasta,
    anulada: fila.anulada,
  }
}

/**
 * Adaptador de persistencia: implementa `AusenciaDAO` con Prisma sobre SQL Server. Es la bisagra entre
 * el ORM y el negocio: nada fuera de este archivo ve una fila de la tabla.
 */
export class AusenciaDAOPrisma implements AusenciaDAO {
  /**
   * @param prisma Cliente de Prisma. Se recibe por constructor, no se importa, para poder
   *   inyectar otro en pruebas de integración.
   */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Inserta la ausencia; la base de datos asigna el UUID y `creadoEn`.
   *
   * @param ausencia Datos completos, sin id.
   * @returns La ausencia guardada.
   */
  async guardar(ausencia: AusenciaNueva): Promise<Ausencia> {
    return aDominio(await this.prisma.ausencia.create({ data: ausencia }))
  }

  /**
   * Busca por id y barbero a la vez: una ausencia de otro barbero no se encuentra (RES-02).
   *
   * @param barberoId Barbero dueño de la ausencia.
   * @param id Identificador de la ausencia.
   * @returns La ausencia, o `null` si ese barbero no tiene una con ese id.
   */
  async porId(barberoId: string, id: string): Promise<Ausencia | null> {
    const fila = await this.prisma.ausencia.findFirst({ where: { id, barberoId } })
    return fila && aDominio(fila)
  }

  /**
   * Todas las ausencias del barbero, también las anuladas.
   *
   * @param barberoId Barbero dueño de las ausencias.
   * @returns Sus ausencias, de la que empieza antes a la que empieza después.
   */
  async deBarbero(barberoId: string): Promise<Ausencia[]> {
    const filas = await this.prisma.ausencia.findMany({ where: { barberoId }, orderBy: { desde: 'asc' } })
    return filas.map(aDominio)
  }

  /**
   * @param id Identificador de una ausencia que ya existe.
   * @param cambios Tipo e intervalo nuevos.
   * @returns La ausencia modificada.
   */
  async actualizar(id: string, cambios: CambiosAusencia): Promise<Ausencia> {
    return aDominio(await this.prisma.ausencia.update({ where: { id }, data: cambios }))
  }

  /**
   * @param id Identificador de una ausencia que ya existe.
   * @returns La ausencia con `anulada: true`.
   */
  async anular(id: string): Promise<Ausencia> {
    return aDominio(await this.prisma.ausencia.update({ where: { id }, data: { anulada: true } }))
  }
}
