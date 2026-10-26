import type { PrismaClient } from './generado/client'
import { Ausencia, type AusenciaDAO, type TipoAusencia, type EstadoAusencia } from '../../dominio/puertos'

export class AusenciaDAOPrisma implements AusenciaDAO {
  constructor(private readonly prisma: PrismaClient) {}

  async guardar(ausencia: Ausencia): Promise<Ausencia> {
    const creada = await this.prisma.ausencia.create({
      data: {
        id: ausencia.id,
        barberoId: ausencia.barberoId,
        tipo: ausencia.tipo,
        desde: ausencia.desde,
        hasta: ausencia.hasta,
        estado: ausencia.estado,
        creadoEn: ausencia.creadoEn,
      },
    })

    return new Ausencia({
      id: creada.id,
      barberoId: creada.barberoId,
      tipo: creada.tipo as TipoAusencia,
      desde: creada.desde,
      hasta: creada.hasta,
      estado: creada.estado as EstadoAusencia,
      creadoEn: creada.creadoEn,
    })
  }

  async buscarPorId(id: string): Promise<Ausencia | null> {
    const registro = await this.prisma.ausencia.findUnique({
      where: { id },
    })

    if (!registro) return null

    return new Ausencia({
      id: registro.id,
      barberoId: registro.barberoId,
      tipo: registro.tipo as TipoAusencia,
      desde: registro.desde,
      hasta: registro.hasta,
      estado: registro.estado as EstadoAusencia,
      creadoEn: registro.creadoEn,
    })
  }

  async buscarPorBarbero(barberoId: string): Promise<Ausencia[]> {
    const registros = await this.prisma.ausencia.findMany({
      where: { barberoId },
      orderBy: { desde: 'asc' },
    })

    return registros.map(
      (r) =>
        new Ausencia({
          id: r.id,
          barberoId: r.barberoId,
          tipo: r.tipo as TipoAusencia,
          desde: r.desde,
          hasta: r.hasta,
          estado: r.estado as EstadoAusencia,
          creadoEn: r.creadoEn,
        })
    )
  }

  async actualizar(ausencia: Ausencia): Promise<Ausencia> {
    const actualizada = await this.prisma.ausencia.update({
      where: { id: ausencia.id },
      data: {
        tipo: ausencia.tipo,
        desde: ausencia.desde,
        hasta: ausencia.hasta,
        estado: ausencia.estado,
      },
    })

    return new Ausencia({
      id: actualizada.id,
      barberoId: actualizada.barberoId,
      tipo: actualizada.tipo as TipoAusencia,
      desde: actualizada.desde,
      hasta: actualizada.hasta,
      estado: actualizada.estado as EstadoAusencia,
      creadoEn: actualizada.creadoEn,
    })
  }
}