import type { CambiosServicio, Servicio, ServicioNuevo } from '../../src/dominio/modelo/Servicio'
import type { ServicioDAO } from '../../src/dominio/puertos'

export class ServicioDAOEnMemoria implements ServicioDAO {
  private readonly filas: Servicio[] = []
  private readonly asignaciones: Map<string, string[]> = new Map()

  async guardar(servicio: ServicioNuevo): Promise<Servicio> {
    const fila = { ...servicio, id: String(this.filas.length + 1) }
    this.filas.push(fila)
    return fila
  }

  /** Igual que el adaptador de Prisma: con `descripcion` en `null`, la conserva. */
  async actualizar(id: string, barberiaId: string, cambios: CambiosServicio): Promise<Servicio | null> {
    const fila = this.filas.find((s) => s.id === id && s.barberiaId === barberiaId)
    if (!fila) return null
    const { descripcion, ...resto } = cambios
    Object.assign(fila, descripcion === null ? resto : { ...resto, descripcion })
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

  async deBarberia(barberiaId: string): Promise<Servicio[]> {
    return this.filas.filter((s) => s.barberiaId === barberiaId)
  }

  async porId(barberiaId: string, id: string): Promise<Servicio | null> {
    return this.filas.find((s) => s.id === id && s.barberiaId === barberiaId) ?? null
  }

  /** Imita a Prisma: `update` lanza si el servicio no existe. */
  async cambiarEstado(id: string, activo: boolean): Promise<Servicio> {
    const fila = this.filas.find((s) => s.id === id)
    if (!fila) throw new Error(`No existe el servicio ${id}`)
    fila.activo = activo
    return fila
  }

  async deBarbero(barberoId: string): Promise<Servicio[]> {
    const idsAsignados = this.asignaciones.get(barberoId) ?? []
    return this.filas.filter((s) => idsAsignados.includes(s.id))
  }

  async asignarABarbero(barberoId: string, serviciosIds: string[]): Promise<void> {
    this.asignaciones.set(barberoId, [...serviciosIds])
  }
}