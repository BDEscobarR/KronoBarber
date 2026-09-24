import type { Usuario, UsuarioNuevo } from '../../src/dominio/modelo/Usuario'
import type { UsuarioDAO } from '../../src/dominio/puertos'

export class UsuarioDAOEnMemoria implements UsuarioDAO {
  private readonly filas: Usuario[] = []

  async guardar(usuario: UsuarioNuevo): Promise<Usuario> {
    const fila = { ...usuario, id: String(this.filas.length + 1) }
    this.filas.push(fila)
    return fila
  }

  async porId(id: string): Promise<Usuario | null> {
    return this.filas.find((u) => u.id === id) ?? null
  }

  async porCorreo(correo: string): Promise<Usuario | null> {
    return this.filas.find((u) => u.correo === correo) ?? null
  }
}
