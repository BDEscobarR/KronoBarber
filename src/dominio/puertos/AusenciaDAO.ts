import type { Ausencia } from '../modelo/Ausencia'

export interface AusenciaDAO {
  guardar(ausencia: Omit<Ausencia, 'id'>): Promise<Ausencia>
  actualizar(id: string, ausencia: Partial<Omit<Ausencia, 'id'>>): Promise<Ausencia>
  eliminar(id: string): Promise<void>
  buscarPorId(id: string): Promise<Ausencia | null>
}