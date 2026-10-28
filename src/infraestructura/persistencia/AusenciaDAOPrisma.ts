import type { PrismaClient } from './generado/client'
import type { Ausencia, TipoAusencia } from '../../dominio/modelo/Ausencia'
import type { AusenciaDAO } from '../../dominio/puertos/AusenciaDAO'

export class AusenciaDAOPrisma implements AusenciaDAO {
  constructor(private readonly prisma: PrismaClient) {}

  async guardar(ausencia: Omit<Ausencia, 'id'>): Promise<Ausencia> {
    const guardada = await this.prisma.ausencia.create({
      data: {
        barberoId: ausencia.barberoId,
        tipo: ausencia.tipo,
        desde: ausencia.desde,
        hasta: ausencia.hasta
      }
    })
    return { ...guardada, tipo: guardada.tipo as TipoAusencia }
  }

  async actualizar(id: string, ausencia: Partial<Omit<Ausencia, 'id'>>): Promise<Ausencia> {
    const actualizada = await this.prisma.ausencia.update({
      where: { id },
      data: ausencia
    })
    return { ...actualizada, tipo: actualizada.tipo as TipoAusencia }
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.ausencia.delete({ where: { id } })
  }

  async buscarPorId(id: string): Promise<Ausencia | null> {
    const encontrada = await this.prisma.ausencia.findUnique({ where: { id } })
    if (!encontrada) return null
    return { ...encontrada, tipo: encontrada.tipo as TipoAusencia }
  }
}