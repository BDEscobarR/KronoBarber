import type { PrismaClient } from './generado/client'
import type { JornadaModel as FilaJornada } from './generado/models'
import { esDiaSemana } from '../../dominio/modelo/HorarioAtencion'
import type { Jornada, JornadaNueva } from '../../dominio/modelo/Jornada'
import type { JornadaDAO } from '../../dominio/puertos'

/**
 * Traduce una fila de la tabla `Jornada` a la entidad del dominio. Descarta `creadoEn`, que existe en
 * la tabla pero no en el dominio.
 *
 * SQL Server no tiene enums en Prisma: `diaSemana` llega como texto libre y se comprueba aquí, antes de
 * entrar al dominio como `DiaSemana`.
 *
 * @param fila Registro leído con Prisma.
 * @returns El renglón de jornada del dominio.
 * @throws {Error} Si la columna `diaSemana` trae un valor que el dominio no conoce.
 */
const aDominio = (fila: FilaJornada): Jornada => {
  if (!esDiaSemana(fila.diaSemana)) throw new Error(`Día de la semana desconocido: ${fila.diaSemana}`)
  return {
    id: fila.id,
    barberoId: fila.barberoId,
    diaSemana: fila.diaSemana,
    franja: { inicio: fila.horaInicio, fin: fila.horaFin },
  }
}

/**
 * El camino inverso de `aDominio`: un renglón nuevo del dominio, en columnas de la tabla.
 *
 * @param jornada Renglón del dominio, sin id.
 * @returns Los datos para `create` de Prisma.
 */
const aFila = ({ franja, ...resto }: JornadaNueva) => ({ ...resto, horaInicio: franja.inicio, horaFin: franja.fin })

/**
 * Adaptador de persistencia: implementa `JornadaDAO` con Prisma sobre SQL Server. Es la bisagra entre
 * el ORM y el negocio: nada fuera de este archivo ve una fila de la tabla.
 */
export class JornadaDAOPrisma implements JornadaDAO {
  /**
   * @param prisma Cliente de Prisma. Se recibe por constructor, no se importa, para poder
   *   inyectar otro en pruebas de integración.
   */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Jornada completa de un barbero.
   *
   * @param barberoId Barbero dueño de la jornada.
   * @returns Sus franjas.
   */
  async deBarbero(barberoId: string): Promise<Jornada[]> {
    const filas = await this.prisma.jornada.findMany({ where: { barberoId } })
    return filas.map(aDominio)
  }

  /**
   * Borra y vuelve a insertar dentro de una transacción: o queda la jornada nueva completa, o queda la
   * anterior.
   *
   * @param barberoId Barbero dueño de la jornada.
   * @param franjas Franjas nuevas.
   * @returns Las franjas guardadas, en el mismo orden en que llegaron.
   */
  async reemplazar(barberoId: string, franjas: JornadaNueva[]): Promise<Jornada[]> {
    return this.prisma.$transaction(async (tx) => {
      await tx.jornada.deleteMany({ where: { barberoId } })
      const guardadas: Jornada[] = []
      for (const franja of franjas) {
        guardadas.push(aDominio(await tx.jornada.create({ data: aFila(franja) })))
      }
      return guardadas
    })
  }
}
