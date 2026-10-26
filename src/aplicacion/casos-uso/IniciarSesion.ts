import { aUsuarioDTO } from '../../dominio/modelo/Usuario'
import type { UsuarioDTO } from '../../dominio/modelo/Usuario'
import type { ServicioClaves, ServicioTokens, UsuarioDAO } from '../../dominio/puertos'

/** El mismo error se usa para correo inexistente, cuenta inactiva y clave incorrecta. */
export class CredencialesInvalidas extends Error {
  constructor() {
    super('Correo o clave incorrectos')
  }
}

/** Datos de acceso recibidos desde la frontera HTTP. */
export interface CredencialesInicioSesion {
  correo: string
  clave: string
}

/** Resultado del inicio de sesión: datos públicos de la cuenta y token de sesión. */
export interface SesionUsuario {
  usuario: UsuarioDTO
  token: string
}

/** Valida credenciales y emite una sesión para una cuenta activa (CAR-17). */
export class IniciarSesion {
  constructor(
    private readonly usuarios: UsuarioDAO,
    private readonly claves: ServicioClaves,
    private readonly tokens: ServicioTokens,
  ) {}

  /**
   * Inicia sesión sin revelar si falló el correo, el estado de la cuenta o la clave.
   * @returns DTO de usuario y token de sesión.
   * @throws {CredencialesInvalidas} Para correo inexistente, cuenta inactiva o clave inválida.
   */
  async ejecutar(credenciales: CredencialesInicioSesion): Promise<SesionUsuario> {
    const correo = credenciales.correo.trim().toLowerCase()
    const usuario = await this.usuarios.porCorreo(correo)

    // Se verifica la clave incluso en cuentas inactivas para no distinguirlas de una clave errónea.
    // Para correo inexistente no hay hash que comparar y se responde con el mismo error público.
    if (!usuario) throw new CredencialesInvalidas()
    const claveCorrecta = await this.claves.verificar(credenciales.clave, usuario.claveHash)
    if (!usuario.activo || !claveCorrecta) throw new CredencialesInvalidas()

    return {
      usuario: aUsuarioDTO(usuario),
      token: await this.tokens.emitir(usuario),
    }
  }
}
