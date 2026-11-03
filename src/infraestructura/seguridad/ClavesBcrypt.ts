import bcrypt from 'bcryptjs'
import type { ServicioClaves } from '../../dominio/puertos'

/**
 * Costo de bcrypt en producción: 2^12 rondas. Hace que adivinar una clave por fuerza bruta sea
 * lento, sin que iniciar sesión se note lento.
 */
const COSTO_POR_DEFECTO = 12

/**
 * Adaptador de seguridad: implementa `ServicioClaves` con bcrypt. Es el único archivo que conoce
 * `bcryptjs` (CAR-17); el hash que produce lleva su propia sal y su costo, así que se guarda tal
 * cual en `Usuario.claveHash` (RES-13).
 */
export class ClavesBcrypt implements ServicioClaves {
  /**
   * @param costo Rondas de bcrypt, como exponente de 2. Se recibe por constructor para que las
   *   pruebas usen un costo bajo; en producción se deja el valor por defecto.
   */
  constructor(private readonly costo: number = COSTO_POR_DEFECTO) {}

  /**
   * @param clave Clave en claro.
   * @returns El hash de bcrypt, con la sal incluida.
   */
  async cifrar(clave: string): Promise<string> {
    return bcrypt.hash(clave, this.costo)
  }

  /**
   * @param clave Clave en claro que escribió el usuario.
   * @param claveHash Hash guardado.
   * @returns `true` si la clave corresponde al hash.
   */
  async comparar(clave: string, claveHash: string): Promise<boolean> {
    return bcrypt.compare(clave, claveHash)
  }
}
