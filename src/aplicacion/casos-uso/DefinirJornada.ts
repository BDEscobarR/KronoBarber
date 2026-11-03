import { estaContenida, seSolapan, type FranjaSemanal } from '../../dominio/modelo/HorarioAtencion'
import { aJornadaDTO, type JornadaDTO, type JornadaNueva } from '../../dominio/modelo/Jornada'
import { esBarberoDe } from '../../dominio/modelo/Usuario'
import type { BarberiaDAO, HorarioAtencionDAO, JornadaDAO, UsuarioDAO } from '../../dominio/puertos'
import { BarberiaNoEncontrada } from './HabilitarBarberia'

/**
 * Error de negocio: el usuario no existe, no es BARBERO o es de otra barbería (RES-02). Los tres casos
 * se responden igual, para no revelar qué usuarios hay en otras barberías. La ruta HTTP lo traduce a 404.
 */
export class BarberoNoEncontrado extends Error {
  /** @param id Identificador del usuario. */
  constructor(id: string) {
    super(`La barbería no tiene un barbero con id ${id}`)
  }
}

/**
 * Error de negocio: el barbero fue desvinculado (`activo = false`, D-17) y ya no atiende, así que no se
 * le registra jornada. La ruta HTTP lo traduce a 409.
 */
export class BarberoDesvinculado extends Error {
  /** @param id Identificador del barbero. */
  constructor(id: string) {
    super(`El barbero ${id} está desvinculado: no se le puede registrar jornada`)
  }
}

/**
 * Error de negocio: la jornada se contradice a sí misma (una franja que no avanza o dos franjas del
 * mismo día que se pisan). La ruta HTTP lo traduce a 400.
 */
export class JornadaInvalida extends Error {}

/**
 * Error de negocio: una franja se sale del horario de atención de la barbería ese día (regla 4,
 * RES-07). Depende de lo que la barbería tiene configurado, no solo de la petición: la ruta HTTP lo
 * traduce a 409.
 */
export class JornadaFueraDeHorario extends Error {
  /** @param franja Franja que no cabe en el horario de atención. */
  constructor({ diaSemana, inicio, fin }: FranjaSemanal) {
    super(`La franja del ${diaSemana} de ${inicio} a ${fin} se sale del horario de atención de la barbería`)
  }
}

/** Datos de entrada de la jornada, ya validados en la frontera HTTP. */
export interface DefinicionJornadaDTO {
  /** Barbería tomada de la URL: la del barbero. */
  barberiaId: string
  /** Barbero tomado de la URL: un `Usuario` con rol BARBERO. */
  barberoId: string
  /** Franjas semanales; varias el mismo día son una jornada partida. */
  franjas: FranjaSemanal[]
}

/**
 * Caso de uso: el administrador registra la jornada de uno de sus barberos (CAR-06). La define el
 * barbero, pero la registra y la modifica solo su administrador (D-16): el barbero se la comunica
 * fuera del sistema. Reemplaza la jornada completa: lo que no viene deja de existir.
 */
export class DefinirJornada {
  /**
   * @param barberias Acceso a datos de las barberías, para comprobar que la barbería existe.
   * @param usuarios Acceso a datos de las cuentas, para comprobar que el barbero es de esa barbería.
   * @param horarios Acceso a datos del horario de atención, el límite de la jornada (RES-07).
   * @param jornadas Acceso a datos de las jornadas.
   */
  constructor(
    private readonly barberias: BarberiaDAO,
    private readonly usuarios: UsuarioDAO,
    private readonly horarios: HorarioAtencionDAO,
    private readonly jornadas: JornadaDAO,
  ) {}

  /**
   * Comprueba que la jornada sea coherente y quepa en el horario de atención, y la guarda en lugar de
   * la anterior.
   *
   * @param datos Jornada completa, ya validada en la frontera HTTP.
   * @returns La jornada guardada.
   * @throws {JornadaInvalida} Si una franja no empieza antes de terminar o dos franjas del mismo día se
   *   solapan.
   * @throws {BarberiaNoEncontrada} Si la barbería no existe.
   * @throws {BarberoNoEncontrado} Si el usuario no existe, no es BARBERO o es de otra barbería.
   * @throws {BarberoDesvinculado} Si el barbero está desvinculado.
   * @throws {JornadaFueraDeHorario} Si una franja se sale del horario de atención de ese día.
   */
  async ejecutar(datos: DefinicionJornadaDTO): Promise<JornadaDTO> {
    datos.franjas.forEach((franja, i) => {
      if (franja.inicio >= franja.fin) throw new JornadaInvalida('inicio debe ser anterior a fin')
      // Regla 5 (semilla), como en el horario: dos franjas del mismo día no se pisan; las contiguas sí.
      if (datos.franjas.slice(0, i).some((otra) => otra.diaSemana === franja.diaSemana && seSolapan(otra, franja)))
        throw new JornadaInvalida('Las franjas del mismo día no pueden solaparse')
    })

    // Se registra en cualquier estado de la barbería (D-03): la suspensión condiciona la visibilidad y
    // las reservas, no la configuración del personal.
    if (!(await this.barberias.porId(datos.barberiaId))) throw new BarberiaNoEncontrada(datos.barberiaId)
    const barbero = await this.usuarios.porId(datos.barberoId)
    if (!barbero || !esBarberoDe(barbero, datos.barberiaId)) throw new BarberoNoEncontrado(datos.barberoId)
    if (!barbero.activo) throw new BarberoDesvinculado(barbero.id)

    // Regla 4 (RES-07): cada franja cabe en un tramo continuo del horario de ese día. Con jornada
    // partida no puede cruzar el cierre del mediodía, y un día sin horario no admite ninguna. Los
    // cierres por fecha no cuentan aquí: la jornada es semanal y los resta la disponibilidad (#37).
    const horario = await this.horarios.deBarberia(datos.barberiaId)
    for (const franja of datos.franjas) {
      const delDia = horario.flatMap((h) => (h.diaSemana === franja.diaSemana && h.franja ? [h.franja] : []))
      if (!estaContenida(franja, delDia)) throw new JornadaFueraDeHorario(franja)
    }

    const renglones: JornadaNueva[] = datos.franjas.map(({ diaSemana, inicio, fin }) => ({
      barberoId: barbero.id,
      diaSemana,
      franja: { inicio, fin },
    }))
    return aJornadaDTO(barbero.id, await this.jornadas.reemplazar(barbero.id, renglones))
  }
}
