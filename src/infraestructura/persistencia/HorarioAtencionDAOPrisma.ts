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
 * El camino inverso de `aDominio`: un renglón nuevo del dominio, en columnas de la tabla. La fecha
 * del cierre (`YYYY-MM-DD`) se pasa a medianoche UTC, que es como `aDominio` la vuelve a leer.
 *
 * @param horario Renglón del dominio, sin id.
 * @returns Los datos para `create` de Prisma.
 */
const aFila = ({ franja, fecha, ...resto }: HorarioAtencionNuevo) => ({
  ...resto,
  fecha: fecha === null ? null : new Date(`${fecha}T00:00:00.000Z`),
  horaInicio: franja?.inicio ?? null,
  horaFin: franja?.fin ?? null,
})

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
    return aDominio(await this.prisma.horarioAtencion.create({ data: aFila(horario) }))
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

  /**
   * Borra y vuelve a insertar dentro de una transacción: o queda el horario nuevo completo, o
   * queda el anterior.
   *
   * @param barberiaId Barbería dueña del horario.
   * @param renglones Franjas semanales y cierres puntuales nuevos.
   * @returns Los renglones guardados, en el mismo orden en que llegaron.
   */
  async reemplazar(barberiaId: string, renglones: HorarioAtencionNuevo[]): Promise<HorarioAtencion[]> {
    return this.prisma.$transaction(async (tx) => {
      await tx.horarioAtencion.deleteMany({ where: { barberiaId } })
      const guardados: HorarioAtencion[] = []
      for (const renglon of renglones) {
        guardados.push(aDominio(await tx.horarioAtencion.create({ data: aFila(renglon) })))
      }
      return guardados
    })
  }
}
