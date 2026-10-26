import type { Ausencia, AusenciaDAO } from '../../src/dominio/puertos'

export class AusenciaDAOEnMemoria implements AusenciaDAO {
  public ausencias: Ausencia[] = []

  async guardar(ausencia: Ausencia): Promise<Ausencia> {
    this.ausencias.push(ausencia)
    return ausencia
  }

  async buscarPorId(id: string): Promise<Ausencia | null> {
    const encontrada = this.ausencias.find((a) => a.id === id)
    return encontrada ?? null
  }

  async buscarPorBarbero(barberoId: string): Promise<Ausencia[]> {
    return this.ausencias.filter((a) => a.barberoId === barberoId)
  }

  async actualizar(ausencia: Ausencia): Promise<Ausencia> {
    const index = this.ausencias.findIndex((a) => a.id === ausencia.id)
    if (index !== -1) {
      this.ausencias[index] = ausencia
    }
    return ausencia
  }
}