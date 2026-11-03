import type { ServicioClaves } from '../../src/dominio/puertos'

// Un "hash" legible a propósito: en las pruebas se puede comprobar que lo guardado no es la clave en
// claro sin pagar el costo de bcrypt.
export class ServicioClavesEnMemoria implements ServicioClaves {
  async cifrar(clave: string): Promise<string> {
    return `hash:${clave}`
  }

  async comparar(clave: string, claveHash: string): Promise<boolean> {
    return claveHash === `hash:${clave}`
  }
}
