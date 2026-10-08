import type { PrismaClient } from './generado/client'
import type { HorarioAtencionModel as FilaHorarioAtencion } from './generado/models'
import {
  esDiaSemanaOpcional,
  type HorarioAtencion,
  type HorarioAtencionNuevo,
} from '../../dominio/modelo/HorarioAtencion'
import type { HorarioAtencionDAO } from '../../dominio/puertos'

/**
 * Traduce una fila de la tabla `HorarioAtencion` a la entidad del dominio. Descarta `creadoEn`,
 * que existe en la tabla pero no en el dominio.
 *
 * SQL Server no tiene enums en Prisma: `diaSemana` llega como texto libre (o `null`, en un cierre
 * puntual) y se comprueba aquí, antes de entrar al dominio como `DiaSemana | null`.
 *
 * @param fila Registro leído con Prisma.
 * @returns El renglón de horario del dominio.
 * @throws {Error} Si la columna `diaSemana` trae un valor que el dominio no conoce.
 */
const aDominio = (fila: FilaHorarioAtencion): HorarioAtencion => {
  if (!esDiaSemanaOpcional(fila.diaSemana)) throw new Error(`Día de la semana desconocido: ${fila.diaSemana}`)
  return {
    id: fila.id,
    barberiaId: fila.barberiaId,
    diaSemana: fila.diaSemana,
    fecha: fila.fecha === null ? null : fila.fecha.toISOString().slice(0, 10),
    franja: fila.horaInicio === null || fila.horaFin === null ? null : { inicio: fila.horaInicio, fin: fila.horaFin },
  }
}

/**
 * Adaptador de persistencia: implementa `HorarioAtencionDAO` con Prisma sobre SQL Server. Es la
 * bisagra entre el ORM y el negocio: nada fuera de este archivo ve una fila de la tabla.
 */
export class HorarioAtencionDAOPrisma implements HorarioAtencionDAO {
  /**
   * @param prisma Cliente de Prisma. Se recibe por constructor, no se importa, para poder
   *   inyectar otro en pruebas de integración.
   */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Inserta el renglón; la base de datos asigna el UUID y `creadoEn`.
   *
   * @param horario Datos completos, sin id.
   * @returns El renglón guardado.
   */
  async guardar(horario: HorarioAtencionNuevo): Promise<HorarioAtencion> {
    const { franja, ...resto } = horario
    return aDominio(
      await this.prisma.horarioAtencion.create({
        data: { ...resto, horaInicio: franja?.inicio ?? null, horaFin: franja?.fin ?? null },
      }),
    )
  }

  /**
   * Horario completo de una barbería: sus franjas semanales y sus cierres puntuales.
   *
   * @param barberiaId Barbería dueña del horario.
   * @returns Los renglones del horario.
   */
  async deBarberia(barberiaId: string): Promise<HorarioAtencion[]> {
    const filas = await this.prisma.horarioAtencion.findMany({ where: { barberiaId } })
    return filas.map(aDominio)
  }
}
