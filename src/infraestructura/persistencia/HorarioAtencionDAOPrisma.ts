import type { PrismaClient } from './generado/client'
import type { HorarioAtencion } from '../../dominio/modelo/HorarioAtencion'
import type { HorarioAtencionDAO } from '../../dominio/puertos'

/** Persistencia del agregado de horario en filas semanales y cierres por fecha. */
export class HorarioAtencionDAOPrisma implements HorarioAtencionDAO {
  constructor(private readonly prisma: PrismaClient) {}

  async reemplazar(horario: HorarioAtencion): Promise<HorarioAtencion> {
    await this.prisma.$transaction(async (tx) => {
      await tx.horarioAtencion.deleteMany({ where: { barberiaId: horario.barberiaId } })
      for (const franja of horario.franjas) {
        await tx.horarioAtencion.create({
          data: {
            barberiaId: horario.barberiaId,
            diaSemana: franja.diaSemana,
            fecha: null,
            horaInicio: franja.horaInicio,
            horaFin: franja.horaFin,
          },
        })
      }
      for (const fecha of horario.cierres) {
        const anio = Number(fecha.slice(0, 4))
        const mes = Number(fecha.slice(5, 7))
        const dia = Number(fecha.slice(8, 10))
        await tx.horarioAtencion.create({
          data: {
            barberiaId: horario.barberiaId,
            diaSemana: null,
            fecha: new Date(Date.UTC(anio, mes - 1, dia)),
            horaInicio: null,
            horaFin: null,
          },
        })
      }
    })
    return horario
  }
}
