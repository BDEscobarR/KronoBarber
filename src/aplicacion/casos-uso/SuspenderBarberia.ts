import type { Barberia } from '../../dominio/modelo/Barberia'
import type { BarberiaDAO } from '../../dominio/puertos'
import { BarberiaNoEncontrada } from './HabilitarBarberia'

/** Error de negocio: la barbería ya estaba suspendida. La ruta HTTP lo traduce a 409. */
export class BarberiaYaSuspendida extends Error {
  /** @param id Identificador de la barbería. */
  constructor(id: string) {
    super(`La barbería ${id} ya está suspendida`)
  }
}

/**
 * Error de negocio: la barbería no está habilitada (sigue pendiente de verificación), así que no hay
 * autorización que retirar. La ruta HTTP lo traduce a 409.
 */
export class BarberiaNoHabilitada extends Error {
  /** @param id Identificador de la barbería. */
  constructor(id: string) {
    super(`La barbería ${id} no está habilitada: solo se suspende una barbería habilitada`)
  }
}

/** Datos de entrada de la suspensión, ya validados en la frontera HTTP. */
export interface SuspensionBarberiaDTO {
  id: string
  /** Por qué se suspende, de 10 a 500 caracteres (D-02). */
  motivo: string
}

/**
 * Caso de uso: el operador de la plataforma suspende una barbería que incumple las políticas (CAR-02).
 *
 * Suspendida, la barbería no se ve ni recibe reservas (RES-11), pero no se borra nada: su catálogo, su
 * horario y su personal siguen, y su administrador puede seguir editándola para corregir el problema
 * (D-03). El motivo queda guardado para el operador y ese administrador; nunca sale en `BarberiaDTO`.
 */
export class SuspenderBarberia {
  /** @param barberias Acceso a datos de las barberías. */
  constructor(private readonly barberias: BarberiaDAO) {}

  /**
   * Suspende la barbería y guarda el motivo.
   *
   * @param datos Barbería y motivo, ya validados en la frontera HTTP.
   * @returns La barbería en estado SUSPENDIDA, con su motivo.
   * @throws {BarberiaNoEncontrada} Si no existe una barbería con ese id.
   * @throws {BarberiaYaSuspendida} Si ya estaba suspendida.
   * @throws {BarberiaNoHabilitada} Si sigue pendiente de verificación.
   */
  async ejecutar(datos: SuspensionBarberiaDTO): Promise<Barberia> {
    const barberia = await this.barberias.porId(datos.id)
    if (!barberia) throw new BarberiaNoEncontrada(datos.id)
    if (barberia.estado === 'SUSPENDIDA') throw new BarberiaYaSuspendida(datos.id)
    // Suspender es retirar una autorización, así que solo se suspende lo que está habilitado (D-02).
    // Una barbería pendiente que no pasa la verificación simplemente no se habilita.
    if (barberia.estado !== 'HABILITADA') throw new BarberiaNoHabilitada(datos.id)

    return this.barberias.cambiarEstado(datos.id, 'SUSPENDIDA', datos.motivo.trim())
  }
}
