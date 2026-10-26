import type { CredencialDTO, ServicioTokens } from '../../src/dominio/puertos'

export class ServicioTokensEnMemoria implements ServicioTokens {
  private readonly emitidos = new Map<string, CredencialDTO>()

  emitir(credencial: CredencialDTO): string {
    const token = `token-${this.emitidos.size + 1}`
    this.emitidos.set(token, { ...credencial })
    return token
  }

  verificar(token: string): CredencialDTO | null {
    return this.emitidos.get(token) ?? null
  }

  // Simula una sesión vencida (D-09) sin depender del tiempo real.
  vencer(token: string): void {
    this.emitidos.delete(token)
  }
}
