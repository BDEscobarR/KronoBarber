import type { Ausencia, AusenciaNueva, CambiosAusencia } from '../../src/dominio/modelo/Ausencia'
import type { AusenciaDAO } from '../../src/dominio/puertos'

export class AusenciaDAOEnMemoria implements AusenciaDAO {
  private readonly filas: Ausencia[] = []

  async guardar(ausencia: AusenciaNueva): Promise<Ausencia> {
    const fila = { ...ausencia, id: String(this.filas.length + 1) }
    this.filas.push(fila)
    return { ...fila }
  }

  async porId(barberoId: string, id: string): Promise<Ausencia | null> {
    const fila = this.filas.find((a) => a.id === id && a.barberoId === barberoId)
    return fila ? { ...fila } : null
  }

  async deBarbero(barberoId: string): Promise<Ausencia[]> {
    return this.filas
      .filter((a) => a.barberoId === barberoId)
      .sort((a, b) => a.desde.getTime() - b.desde.getTime())
      .map((a) => ({ ...a }))
  }

  async actualizar(id: string, cambios: CambiosAusencia): Promise<Ausencia> {
    const fila = this.buscar(id)
    Object.assign(fila, cambios)
    return { ...fila }
  }

  async anular(id: string): Promise<Ausencia> {
    const fila = this.buscar(id)
    fila.anulada = true
    return { ...fila }
  }

  // Como `update` de Prisma: falla si la fila no existe. El caso de uso lo comprueba antes.
  private buscar(id: string): Ausencia {
    const fila = this.filas.find((a) => a.id === id)
    if (!fila) throw new Error(`No existe la ausencia ${id}`)
    return fila
  }
}
