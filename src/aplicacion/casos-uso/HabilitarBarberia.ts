import type { Barberia } from '../../dominio/modelo/Barberia'
import type { BarberiaDAO } from '../../dominio/puertos'

/**
 * Error de negocio: la barbería pedida no existe. Lo comparten los casos de uso que parten de una
 * barbería (`HabilitarBarberia`, `CrearServicio`); la ruta HTTP lo traduce a 404.
 */
export class BarberiaNoEncontrada extends Error {
  /** @param id Identificador que no corresponde a ninguna barbería. */
  constructor(id: string) {
    super(`No existe la barbería ${id}`)
  }
}

/** Error de negocio: la barbería ya estaba habilitada. La ruta HTTP lo traduce a 409. */
export class BarberiaYaHabilitada extends Error {
  /** @param id Identificador de la barbería. */
  constructor(id: string) {
    super(`La barbería ${id} ya está habilitada`)
  }
}

/**
 * Caso de uso: el operador de la plataforma verifica una barbería y la habilita para que sea
 * visible y reciba reservas (CAR-02, RES-11).
 *
 * Sirve tanto para una barbería pendiente de verificación como para rehabilitar una suspendida;
 * en ese caso borra el motivo de la suspensión.
 */
export class HabilitarBarberia {
  /** @param barberias Acceso a datos de las barberías. */
  constructor(private readonly barberias: BarberiaDAO) {}

  /**
   * Habilita la barbería.
   *
   * @param id Identificador de la barbería.
   * @returns La barbería en estado HABILITADA y sin motivo de suspensión.
   * @throws {BarberiaNoEncontrada} Si no existe una barbería con ese id.
   * @throws {BarberiaYaHabilitada} Si ya estaba habilitada.
   */
  async ejecutar(id: string): Promise<Barberia> {
    const barberia = await this.barberias.porId(id)
    if (!barberia) throw new BarberiaNoEncontrada(id)
    // Se habilita desde PENDIENTE_VERIFICACION o SUSPENDIDA (CAR-02). Habilitar dos
    // veces es un error, no una operación vacía: el operador debe saber que no cambió nada.
    if (barberia.estado === 'HABILITADA') throw new BarberiaYaHabilitada(id)

    return this.barberias.cambiarEstado(id, 'HABILITADA', null)
  }
}
