import { aAusenciaDTO, terminaDespuesDeEmpezar, type AusenciaDTO, type TipoAusencia } from '../../dominio/modelo/Ausencia'
import { esBarberoDe } from '../../dominio/modelo/Usuario'
import type { AusenciaDAO, BarberiaDAO, UsuarioDAO } from '../../dominio/puertos'
import { BarberoDesvinculado, BarberoNoEncontrado } from './DefinirJornada'
import { BarberiaNoEncontrada } from './HabilitarBarberia'

/**
 * Error de negocio: la ausencia no termina después de empezar (criterio de #20). La ruta HTTP lo
 * traduce a 400. Lo comparten `RegistrarAusencia` y `ModificarAusencia`.
 */
export class AusenciaInvalida extends Error {
  constructor() {
    super('La ausencia debe terminar después de empezar')
  }
}

/** Datos de entrada de una ausencia, ya validados en la frontera HTTP. */
export interface RegistroAusenciaDTO {
  /** Barbería tomada de la URL: la del barbero. */
  barberiaId: string
  /** Barbero tomado de la URL: un `Usuario` con rol BARBERO. */
  barberoId: string
  /** Cómo la nombra el administrador. */
  tipo: TipoAusencia
  /** Instante en que empieza, ya convertido a `Date` en la frontera. */
  desde: Date
  /** Instante en que termina. */
  hasta: Date
}

/**
 * Caso de uso: el administrador registra un día libre, un permiso o un bloqueo de uno de sus barberos
 * (CAR-06). El barbero se lo comunica fuera del sistema: no hay solicitud ni aprobación, y la ausencia
 * rige desde que se guarda (D-16).
 */
export class RegistrarAusencia {
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
   * Comprueba que la ausencia sea de un barbero activo de esa barbería y la guarda vigente.
   *
   * @param datos Ausencia, ya validada en la frontera HTTP.
   * @returns La ausencia guardada, sin anular.
   * @throws {AusenciaInvalida} Si no termina después de empezar.
   * @throws {BarberiaNoEncontrada} Si la barbería no existe.
   * @throws {BarberoNoEncontrado} Si el usuario no existe, no es BARBERO o es de otra barbería.
   * @throws {BarberoDesvinculado} Si el barbero está desvinculado.
   */
  async ejecutar(datos: RegistroAusenciaDTO): Promise<AusenciaDTO> {
    if (!terminaDespuesDeEmpezar(datos)) throw new AusenciaInvalida()

    // Se registra en cualquier estado de la barbería (D-03): la suspensión condiciona la visibilidad y
    // las reservas, no la gestión del personal.
    if (!(await this.barberias.porId(datos.barberiaId))) throw new BarberiaNoEncontrada(datos.barberiaId)
    const barbero = await this.usuarios.porId(datos.barberoId)
    if (!barbero || !esBarberoDe(barbero, datos.barberiaId)) throw new BarberoNoEncontrado(datos.barberoId)
    if (!barbero.activo) throw new BarberoDesvinculado(barbero.id, 'registrar ausencias')

    const { tipo, desde, hasta } = datos
    return aAusenciaDTO(await this.ausencias.guardar({ barberoId: barbero.id, tipo, desde, hasta, anulada: false }))
  }
}
