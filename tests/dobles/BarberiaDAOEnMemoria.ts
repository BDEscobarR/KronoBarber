import type { Barberia, BarberiaNueva, EstadoBarberia } from '../../src/dominio/modelo/Barberia'
import type { BarberiaDAO } from '../../src/dominio/puertos'

export class BarberiaDAOEnMemoria implements BarberiaDAO {
  private readonly filas: Barberia[] = []

  async guardar(barberia: BarberiaNueva): Promise<Barberia> {
    const fila = { ...barberia, id: String(this.filas.length + 1) }
    this.filas.push(fila)
    return fila
  }

  async porId(id: string): Promise<Barberia | null> {
    return this.filas.find((b) => b.id === id) ?? null
  }

  async porCorreo(correo: string): Promise<Barberia | null> {
    return this.filas.find((b) => b.correo === correo) ?? null
  }

  async habilitadas(ciudad: string | null): Promise<Barberia[]> {
    return this.filas.filter((b) => b.estado === 'HABILITADA' && (ciudad === null || b.ciudad === ciudad))
  }

  async cambiarEstado(id: string, estado: EstadoBarberia, motivoSuspension: string | null): Promise<Barberia> {
    const indice = this.filas.findIndex((b) => b.id === id)
    const fila = this.filas[indice]
    if (!fila) throw new Error(`No existe la barbería ${id}`)
    // Se reemplaza, como haría la BD: quien guardó la versión anterior no la ve cambiar.
    const actualizada = { ...fila, estado, motivoSuspension }
    this.filas[indice] = actualizada
    return actualizada
  }
}
