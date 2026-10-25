import { esVisibleParaClientes } from '../../dominio/modelo/Barberia'
import { DIAS_SEMANA } from '../../dominio/modelo/HorarioAtencion'
import type { BarberiaDAO, HorarioAtencionDAO } from '../../dominio/puertos'
import { aConfiguracion, type ConfiguracionHorarioDTO } from './ConfigurarHorarioAtencion'
import { BarberiaNoEncontrada } from './HabilitarBarberia'

/**
 * Caso de uso: cualquiera consulta el horario de atención de una barbería (CAR-05, D-06), con la misma
 * forma en que lo configura su administrador: franjas semanales y cierres por fecha.
 *
 * Es público, como la vitrina de servicios: solo se ve el de una barbería habilitada (RES-11). Que su
 * administrador lo vea en cualquier estado llega con las guardas por rol de la Fase 4 (#27).
 */
export class ConsultarHorarioAtencion {
  /**
   * @param barberias Acceso a datos de las barberías, para comprobar que la barbería es visible.
   * @param horarios Acceso a datos del horario de atención.
   */
  constructor(
    private readonly barberias: BarberiaDAO,
    private readonly horarios: HorarioAtencionDAO,
  ) {}

  /**
   * Lee el horario de una barbería habilitada y lo ordena: la base de datos no garantiza ningún orden.
   *
   * @param barberiaId Barbería tomada de la URL.
   * @returns El horario completo: franjas de lunes a domingo y por hora de inicio, y cierres por fecha.
   *   Sin horario configurado, las dos listas vacías.
   * @throws {BarberiaNoEncontrada} Si la barbería no existe o no está habilitada.
   */
  async ejecutar(barberiaId: string): Promise<ConfiguracionHorarioDTO> {
    // Una barbería no habilitada no existe para nadie de afuera (RES-11): se responde igual que si no
    // existiera, como en la vitrina de servicios.
    const barberia = await this.barberias.porId(barberiaId)
    if (!barberia || !esVisibleParaClientes(barberia)) throw new BarberiaNoEncontrada(barberiaId)

    const { franjas, cierres } = aConfiguracion(barberiaId, await this.horarios.deBarberia(barberiaId))
    return {
      barberiaId,
      franjas: franjas.sort(
        (a, b) =>
          DIAS_SEMANA.indexOf(a.diaSemana) - DIAS_SEMANA.indexOf(b.diaSemana) || a.inicio.localeCompare(b.inicio),
      ),
      cierres: cierres.sort(),
    }
  }
}
