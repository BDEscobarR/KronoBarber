import type { HorarioAtencion, HorarioAtencionNuevo } from '../../src/dominio/modelo/HorarioAtencion'
import type { HorarioAtencionDAO } from '../../src/dominio/puertos'

export class HorarioAtencionDAOEnMemoria implements HorarioAtencionDAO {
  private readonly filas: HorarioAtencion[] = []
  /** Contador de ids: con `reemplazar` se borran renglones y `filas.length` podría repetir uno. */
  private ultimoId = 0

  async guardar(horario: HorarioAtencionNuevo): Promise<HorarioAtencion> {
    const fila = { ...horario, id: String(++this.ultimoId) }
    this.filas.push(fila)
    return fila
  }

  async deBarberia(barberiaId: string): Promise<HorarioAtencion[]> {
    return this.filas.filter((h) => h.barberiaId === barberiaId)
  }

  async reemplazar(barberiaId: string, renglones: HorarioAtencionNuevo[]): Promise<HorarioAtencion[]> {
    const deOtras = this.filas.filter((h) => h.barberiaId !== barberiaId)
    this.filas.splice(0, this.filas.length, ...deOtras)
    const guardados: HorarioAtencion[] = []
    for (const renglon of renglones) guardados.push(await this.guardar(renglon))
    return guardados
  }
}
