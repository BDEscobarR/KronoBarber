import { aAusenciaDTO, type AusenciaDTO } from '../../dominio/modelo/Ausencia'
import { esBarberoDe } from '../../dominio/modelo/Usuario'
import type { AusenciaDAO, BarberiaDAO, UsuarioDAO } from '../../dominio/puertos'
import { BarberoDesvinculado, BarberoNoEncontrado } from './DefinirJornada'
import { BarberiaNoEncontrada } from './HabilitarBarberia'
import { AusenciaAnulada, AusenciaNoEncontrada } from './ModificarAusencia'

/** Datos de entrada de la anulación, tomados de la URL: la acción no lleva cuerpo. */
export interface AnulacionAusenciaDTO {
  /** Barbería tomada de la URL: la del barbero. */
  barberiaId: string
  /** Barbero tomado de la URL: un `Usuario` con rol BARBERO. */
  barberoId: string
  /** Ausencia tomada de la URL. */
  ausenciaId: string
}

/**
 * Caso de uso: el administrador anula una ausencia de uno de sus barberos (CAR-06, D-16), por ejemplo
 * porque al final sí viene a trabajar. Anulada, deja de restar disponibilidad, pero no se borra: queda
 * en el historial, igual que un servicio desactivado (D-04) o un barbero desvinculado (D-17).
 */
export class AnularAusencia {
  /**
   * @param barberias Acceso a datos de las barberías, para comprobar que la barbería existe.
   * @param usuarios Acceso a datos de las cuentas, para comprobar que el barbero es de esa barbería.
   * @param ausencias Acceso a datos de las ausencias.
   */
  constructor(
    private readonly barberias: BarberiaDAO,
    private readonly usuarios: UsuarioDAO,
    private readonly ausencias: AusenciaDAO,
  ) {}

  /**
   * Comprueba que la ausencia sea de un barbero activo de esa barbería y que siga vigente, y la anula.
   * Anular una ya anulada es un error, no una operación vacía, como habilitar una barbería ya
   * habilitada.
   *
   * @param datos Barbería, barbero y ausencia, tomados de la URL.
   * @returns La ausencia con `anulada: true`.
   * @throws {BarberiaNoEncontrada} Si la barbería no existe.
   * @throws {BarberoNoEncontrado} Si el usuario no existe, no es BARBERO o es de otra barbería.
   * @throws {BarberoDesvinculado} Si el barbero está desvinculado.
   * @throws {AusenciaNoEncontrada} Si el barbero no tiene una ausencia con ese id.
   * @throws {AusenciaAnulada} Si la ausencia ya estaba anulada.
   */
  async ejecutar(datos: AnulacionAusenciaDTO): Promise<AusenciaDTO> {
    // Como al registrarla, vale en cualquier estado de la barbería (D-03).
    if (!(await this.barberias.porId(datos.barberiaId))) throw new BarberiaNoEncontrada(datos.barberiaId)
    const barbero = await this.usuarios.porId(datos.barberoId)
    if (!barbero || !esBarberoDe(barbero, datos.barberiaId)) throw new BarberoNoEncontrado(datos.barberoId)
    if (!barbero.activo) throw new BarberoDesvinculado(barbero.id, 'anular ausencias')

    const ausencia = await this.ausencias.porId(barbero.id, datos.ausenciaId)
    if (!ausencia) throw new AusenciaNoEncontrada(datos.ausenciaId)
    if (ausencia.anulada) throw new AusenciaAnulada(ausencia.id)

    return aAusenciaDTO(await this.ausencias.anular(ausencia.id))
  }
}
