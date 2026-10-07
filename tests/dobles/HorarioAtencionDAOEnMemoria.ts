import type { HorarioAtencion } from '../../src/dominio/modelo/HorarioAtencion'
import type { HorarioAtencionDAO } from '../../src/dominio/puertos'

export class HorarioAtencionDAOEnMemoria implements HorarioAtencionDAO {
  private readonly porBarberia = new Map<string, HorarioAtencion>()

  async reemplazar(horario: HorarioAtencion): Promise<HorarioAtencion> {
    const copia = structuredClone(horario)
    this.porBarberia.set(horario.barberiaId, copia)
    return structuredClone(copia)
  }
}
