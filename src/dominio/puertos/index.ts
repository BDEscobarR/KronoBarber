// Puertos: lo que el dominio necesita del exterior, en su propio vocabulario.
//
// - `...DAO`  → acceso a datos: quien sepa guardar y recuperar entidades.
// - `...DTO`  → estructura de datos que cruza una frontera.
// - Sin sufijo → contratos de comportamiento, que no son ni datos ni persistencia.

import type { Barberia, BarberiaNueva, EstadoBarberia } from '../modelo/Barberia'
import type { Servicio, ServicioNuevo } from '../modelo/Servicio'

export interface BarberiaDAO {
  guardar(barberia: BarberiaNueva): Promise<Barberia>
  porId(id: string): Promise<Barberia | null>
  porCorreo(correo: string): Promise<Barberia | null>
  /** Catálogo público (CAR-07): solo las habilitadas. `null` no filtra por ciudad. */
  habilitadas(ciudad: string | null): Promise<Barberia[]>
  cambiarEstado(id: string, estado: EstadoBarberia, motivoSuspension: string | null): Promise<Barberia>
}

export interface ServicioDAO {
  guardar(servicio: ServicioNuevo): Promise<Servicio>
  /** El nombre es único dentro de una barbería y se compara sin distinguir mayúsculas. */
  porNombre(barberiaId: string, nombre: string): Promise<Servicio | null>
  activosDe(barberiaId: string): Promise<Servicio[]>
}
