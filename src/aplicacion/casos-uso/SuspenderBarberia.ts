import type { Barberia } from '../../dominio/modelo/Barberia'
import type { BarberiaDAO } from '../../dominio/puertos'

/**
 * Error de negocio: La barbería pedida no existe.
 */
export class BarberiaNoEncontrada extends Error {
  constructor(id: string) {
    super(`No existe la barbería ${id}`)
  }
}

/**
 * Error de negocio: La barbería ya se encontraba suspendida.
 */
export class BarberiaYaSuspendida extends Error {
  constructor(id: string) {
    super(`La barbería ${id} ya está suspendida`)
  }
}

/**
 * Caso de uso: el operador de la plataforma suspende una barbería por incumplimiento de políticas (CAR-02, RES-11).
 * Detiene la recepción de nuevas reservas sin borrar la información histórica.
 */
export class SuspenderBarberia {
  constructor(private readonly barberias: BarberiaDAO) {}

  async ejecutar(id: string): Promise<Barberia> {
    const barberia = await this.barberias.porId(id)
    if (!barberia) throw new BarberiaNoEncontrada(id)

    if (barberia.estado === 'SUSPENDIDA') {
      throw new BarberiaYaSuspendida(id)
    }

    return this.barberias.cambiarEstado(id, 'SUSPENDIDA', null)
  }
}