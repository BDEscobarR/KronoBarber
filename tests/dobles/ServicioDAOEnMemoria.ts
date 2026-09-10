import type { Servicio, ServicioNuevo } from '../../src/dominio/modelo/Servicio'
import type { ServicioDAO } from '../../src/dominio/puertos'

export class ServicioDAOEnMemoria implements ServicioDAO {
  private readonly filas: Servicio[] = []

  async guardar(servicio: ServicioNuevo): Promise<Servicio> {
    const fila = { ...servicio, id: String(this.filas.length + 1) }
    this.filas.push(fila)
    return fila
  }

  /** Imita la intercalación de SQL Server, que no distingue mayúsculas. */
  async porNombre(barberiaId: string, nombre: string): Promise<Servicio | null> {
    const buscado = nombre.toLowerCase()
    return this.filas.find((s) => s.barberiaId === barberiaId && s.nombre.toLowerCase() === buscado) ?? null
  }

  async activosDe(barberiaId: string): Promise<Servicio[]> {
    return this.filas.filter((s) => s.barberiaId === barberiaId && s.activo)
  }
}
