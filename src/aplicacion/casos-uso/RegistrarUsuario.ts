import { aUsuarioDTO, perteneceABarberia, type RolUsuario, type UsuarioDTO } from '../../dominio/modelo/Usuario'
import type { ServicioClaves, UsuarioDAO } from '../../dominio/puertos'
import { CorreoYaRegistrado } from './CorreoYaRegistrado'

/** Datos de entrada del registro, sin rol: este siempre lo determina quien invoca el caso de uso. */
export interface RegistroUsuarioDTO {
  nombre: string
  correo: string
  clave: string
  barberiaId: string | null
}

/** Error de negocio: la clave no cumple la longitud admitida por la plataforma. */
export class ClaveInvalida extends Error {
  constructor() {
    super('La clave debe tener entre 10 y 64 caracteres')
  }
}

/** Error de negocio: la barbería es obligatoria solo para los roles vinculados a un negocio. */
export class BarberiaRequeridaParaRol extends Error {
  constructor(rol: RolUsuario) {
    super(`El rol ${rol} requiere una barbería`)
  }
}

/** Error de negocio: un rol transversal no puede quedar vinculado a una barbería. */
export class RolNoPerteneceABarberia extends Error {
  constructor(rol: RolUsuario) {
    super(`El rol ${rol} no puede pertenecer a una barbería`)
  }
}

/** Crea cuentas (CAR-17), manteniendo la clave en texto claro fuera de persistencia y respuesta. */
export class RegistrarUsuario {
  constructor(
    private readonly usuarios: UsuarioDAO,
    private readonly claves: ServicioClaves,
  ) {}

  /**
   * Registra un usuario con el rol confiable fijado por quien llama, nunca por el cuerpo de la petición.
   * @param datos Datos del usuario; `barberiaId` debe ser null para roles transversales.
   * @param rol Rol decidido por el llamador.
   * @returns Cuenta creada sin incluir `claveHash`.
   */
  async ejecutar(datos: RegistroUsuarioDTO, rol: RolUsuario): Promise<UsuarioDTO> {
    if (datos.clave.length < 10 || datos.clave.length > 64) throw new ClaveInvalida()

    const barberiaRequerida = perteneceABarberia(rol)
    if (barberiaRequerida && !datos.barberiaId) throw new BarberiaRequeridaParaRol(rol)
    if (!barberiaRequerida && datos.barberiaId !== null) throw new RolNoPerteneceABarberia(rol)

    const correo = datos.correo.trim().toLowerCase()
    if (await this.usuarios.porCorreo(correo)) throw new CorreoYaRegistrado(correo)

    const usuario = await this.usuarios.guardar({
      nombre: datos.nombre.trim(),
      correo,
      claveHash: await this.claves.hash(datos.clave),
      rol,
      barberiaId: datos.barberiaId,
      activo: true,
    })
    return aUsuarioDTO(usuario)
  }
}
