import type { HorarioAtencion, HorarioAtencionNuevo } from '../../src/dominio/modelo/HorarioAtencion'
import type { HorarioAtencionDAO } from '../../src/dominio/puertos'

export class HorarioAtencionDAOEnMemoria implements HorarioAtencionDAO {
  private readonly filas: HorarioAtencion[] = []

  async guardar(horario: HorarioAtencionNuevo): Promise<HorarioAtencion> {
    const fila = { ...horario, id: String(this.filas.length + 1) }
    this.filas.push(fila)
    return fila
  }

  async deBarberia(barberiaId: string): Promise<HorarioAtencion[]> {
    return this.filas.filter((h) => h.barberiaId === barberiaId)
  }
}
