import { aAusenciaDTO, terminaDespuesDeEmpezar, type AusenciaDTO } from '../../dominio/modelo/Ausencia'
import { esBarberoDe } from '../../dominio/modelo/Usuario'
import type { AusenciaDAO, BarberiaDAO, UsuarioDAO } from '../../dominio/puertos'
import { BarberoDesvinculado, BarberoNoEncontrado } from './DefinirJornada'
import { BarberiaNoEncontrada } from './HabilitarBarberia'
import { AusenciaInvalida, type RegistroAusenciaDTO } from './RegistrarAusencia'

/**
 * Error de negocio: el barbero no tiene una ausencia con ese id, porque no existe o es de otro barbero
 * (RES-02). La ruta HTTP lo traduce a 404. Lo comparten `ModificarAusencia` y `AnularAusencia`.
 */
export class AusenciaNoEncontrada extends Error {
  /** @param id Identificador de la ausencia. */
  constructor(id: string) {
    super(`El barbero no tiene una ausencia con id ${id}`)
  }
}

/**
 * Error de negocio: la ausencia ya fue anulada. Anulada, no se modifica ni se vuelve a anular: si el
 * barbero vuelve a faltar, se registra otra. La ruta HTTP lo traduce a 409. Lo comparten
 * `ModificarAusencia` y `AnularAusencia`.
 */
export class AusenciaAnulada extends Error {
  /** @param id Identificador de la ausencia. */
  constructor(id: string) {
    super(`La ausencia ${id} ya está anulada`)
  }
}

/** Datos de entrada de la modificación: los mismos del registro, más la ausencia tomada de la URL. */
export interface ModificacionAusenciaDTO extends RegistroAusenciaDTO {
  /** Ausencia tomada de la URL. */
  ausenciaId: string
}

/**
 * Caso de uso: el administrador modifica el tipo o el intervalo de una ausencia de uno de sus
 * barberos (CAR-06, D-16). Reemplaza los dos: lo que no viene no se conserva.
 */
export class ModificarAusencia {
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
   * Comprueba que la ausencia sea de un barbero activo de esa barbería y que siga vigente, y guarda los
   * cambios.
   *
   * @param datos Tipo e intervalo nuevos, ya validados en la frontera HTTP.
   * @returns La ausencia modificada.
   * @throws {AusenciaInvalida} Si no termina después de empezar.
   * @throws {BarberiaNoEncontrada} Si la barbería no existe.
   * @throws {BarberoNoEncontrado} Si el usuario no existe, no es BARBERO o es de otra barbería.
   * @throws {BarberoDesvinculado} Si el barbero está desvinculado.
   * @throws {AusenciaNoEncontrada} Si el barbero no tiene una ausencia con ese id.
   * @throws {AusenciaAnulada} Si la ausencia ya fue anulada.
   */
  async ejecutar(datos: ModificacionAusenciaDTO): Promise<AusenciaDTO> {
    if (!terminaDespuesDeEmpezar(datos)) throw new AusenciaInvalida()

    // Como al registrarla, vale en cualquier estado de la barbería (D-03).
    if (!(await this.barberias.porId(datos.barberiaId))) throw new BarberiaNoEncontrada(datos.barberiaId)
    const barbero = await this.usuarios.porId(datos.barberoId)
    if (!barbero || !esBarberoDe(barbero, datos.barberiaId)) throw new BarberoNoEncontrado(datos.barberoId)
    if (!barbero.activo) throw new BarberoDesvinculado(barbero.id, 'modificar ausencias')

    const ausencia = await this.ausencias.porId(barbero.id, datos.ausenciaId)
    if (!ausencia) throw new AusenciaNoEncontrada(datos.ausenciaId)
    if (ausencia.anulada) throw new AusenciaAnulada(ausencia.id)

    const { tipo, desde, hasta } = datos
    return aAusenciaDTO(await this.ausencias.actualizar(ausencia.id, { tipo, desde, hasta }))
  }
}
