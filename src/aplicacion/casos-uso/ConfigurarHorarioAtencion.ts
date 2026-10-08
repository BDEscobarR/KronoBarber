import {
  seSolapan,
  type DiaSemana,
  type Franja,
  type HorarioAtencion,
  type HorarioAtencionNuevo,
} from '../../dominio/modelo/HorarioAtencion'
import type { BarberiaDAO, HorarioAtencionDAO } from '../../dominio/puertos'
import { BarberiaNoEncontrada } from './HabilitarBarberia'

/**
 * Error de negocio: el horario se contradice a sí mismo (una franja que no avanza, dos franjas del
 * mismo día que se pisan o un cierre repetido). La ruta HTTP lo traduce a 400.
 */
export class HorarioInvalido extends Error {}

/** Franja semanal recurrente: un día de la semana y su horario de atención. */
export interface FranjaSemanal extends Franja {
  diaSemana: DiaSemana
}

/**
 * Horario completo de una barbería tal como lo maneja el administrador: lo que recibe el caso de
 * uso, ya validado en la frontera HTTP, y lo que devuelve una vez guardado.
 */
export interface ConfiguracionHorarioDTO {
  barberiaId: string
  /** Franjas semanales; varias para el mismo día permiten la jornada partida. */
  franjas: FranjaSemanal[]
  /** Fechas (`YYYY-MM-DD`) en que la barbería no atiende, sin importar su franja semanal. */
  cierres: string[]
}

/**
 * Agrupa los renglones guardados en la forma en que los configura el administrador.
 *
 * @param barberiaId Barbería dueña del horario.
 * @param renglones Franjas semanales y cierres puntuales, en cualquier orden.
 * @returns El horario completo de la barbería.
 */
function aConfiguracion(barberiaId: string, renglones: HorarioAtencion[]): ConfiguracionHorarioDTO {
  const franjas: FranjaSemanal[] = []
  const cierres: string[] = []
  for (const { diaSemana, fecha, franja } of renglones) {
    if (diaSemana !== null && franja !== null) franjas.push({ diaSemana, ...franja })
    else if (fecha !== null) cierres.push(fecha)
  }
  return { barberiaId, franjas, cierres }
}

/**
 * Caso de uso: el administrador define el horario de atención de su barbería (CAR-05), el límite
 * exterior de toda disponibilidad (RES-07). Reemplaza el horario completo: lo que no viene en la
 * configuración deja de existir.
 */
export class ConfigurarHorarioAtencion {
  /**
   * @param barberias Acceso a datos de las barberías, para comprobar que la dueña existe.
   * @param horarios Acceso a datos del horario de atención.
   */
  constructor(
    private readonly barberias: BarberiaDAO,
    private readonly horarios: HorarioAtencionDAO,
  ) {}

  /**
   * Comprueba que el horario sea coherente y lo guarda en lugar del anterior.
   *
   * @param datos Horario completo, ya validado en la frontera HTTP.
   * @returns El horario guardado.
   * @throws {HorarioInvalido} Si una franja no empieza antes de terminar, dos franjas del mismo día
   *   se solapan o un cierre repite fecha.
   * @throws {BarberiaNoEncontrada} Si la barbería no existe.
   */
  async ejecutar(datos: ConfiguracionHorarioDTO): Promise<ConfiguracionHorarioDTO> {
    datos.franjas.forEach((franja, i) => {
      if (franja.inicio >= franja.fin) throw new HorarioInvalido('inicio debe ser anterior a fin')
      // Regla 5 (semilla): dos franjas del mismo día no se pisan; las contiguas sí se admiten.
      if (datos.franjas.slice(0, i).some((otra) => otra.diaSemana === franja.diaSemana && seSolapan(otra, franja)))
        throw new HorarioInvalido('Las franjas del mismo día no pueden solaparse')
    })
    if (new Set(datos.cierres).size !== datos.cierres.length)
      throw new HorarioInvalido('cierres no puede contener fechas repetidas')

    // No se exige que esté habilitada: configurar el horario es parte de la puesta en marcha.
    if (!(await this.barberias.porId(datos.barberiaId))) throw new BarberiaNoEncontrada(datos.barberiaId)

    const { barberiaId } = datos
    const renglones: HorarioAtencionNuevo[] = [
      ...datos.franjas.map(({ diaSemana, inicio, fin }) => ({
        barberiaId,
        diaSemana,
        fecha: null,
        franja: { inicio, fin },
      })),
      ...datos.cierres.map((fecha) => ({ barberiaId, diaSemana: null, fecha, franja: null })),
    ]
    return aConfiguracion(barberiaId, await this.horarios.reemplazar(barberiaId, renglones))
  }
}
