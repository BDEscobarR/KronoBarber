import type { Barberia } from '../../dominio/modelo/Barberia'
import type { BarberiaDAO } from '../../dominio/puertos'

export class BarberiaNoEncontrada extends Error {
  constructor(id: string) {
    super(`No existe la barbería ${id}`)
  }
}

export class BarberiaYaHabilitada extends Error {
  constructor(id: string) {
    super(`La barbería ${id} ya está habilitada`)
  }
}

export class HabilitarBarberia {
  constructor(private readonly barberias: BarberiaDAO) {}

  async ejecutar(id: string): Promise<Barberia> {
    const barberia = await this.barberias.porId(id)
    if (!barberia) throw new BarberiaNoEncontrada(id)
    // Se habilita desde PENDIENTE_VERIFICACION o SUSPENDIDA (CAR-02). Habilitar dos
    // veces es un error, no una operación vacía: el operador debe saber que no cambió nada.
    if (barberia.estado === 'HABILITADA') throw new BarberiaYaHabilitada(id)

    return this.barberias.cambiarEstado(id, 'HABILITADA', null)
  }
}
