import type { Jornada, JornadaNueva } from '../../src/dominio/modelo/Jornada'
import type { JornadaDAO } from '../../src/dominio/puertos'

export class JornadaDAOEnMemoria implements JornadaDAO {
  private readonly filas: Jornada[] = []
  /** Contador de ids: con `reemplazar` se borran renglones y `filas.length` podría repetir uno. */
  private ultimoId = 0

  async deBarbero(barberoId: string): Promise<Jornada[]> {
    return this.filas.filter((j) => j.barberoId === barberoId)
  }

  async reemplazar(barberoId: string, franjas: JornadaNueva[]): Promise<Jornada[]> {
    const deOtros = this.filas.filter((j) => j.barberoId !== barberoId)
    const guardadas = franjas.map((franja) => ({ ...franja, id: String(++this.ultimoId) }))
    this.filas.splice(0, this.filas.length, ...deOtros, ...guardadas)
    return guardadas
  }
}
