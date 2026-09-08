import { IdBarberia } from "../../../dominio/modelo/valores/IdBarberia";
import { IdServicio } from "../../../dominio/modelo/valores/IdServicio";
import { Reloj, RepositorioServicios } from "../../../dominio/puertos";
import { ServicioDto, aServicioDto } from "../../dto/ServicioDto";
import { AccesoNoAutorizado, ServicioNoEncontrado } from "../../errores/ErrorAplicacion";

export interface ComandoDesactivarServicio {
  readonly idServicio: string;
  readonly idBarberiaDelSolicitante: string;
}

/**
 * El administrador retira un servicio del catálogo **sin borrarlo** (CAR-03).
 *
 * Es la operación que sustituye al DELETE: los turnos ya atendidos siguen
 * apuntando a este servicio y son el historial del cliente (NC-07). Por eso la
 * API de servicios no expone `DELETE`.
 *
 * Los turnos futuros ya confirmados sobre este servicio **no se cancelan**:
 * desactivar cierra la puerta a reservas nuevas, no rompe compromisos ya
 * pagados. Cancelarlos es una decisión distinta, con su propia política (CAR-12).
 */
export class DesactivarServicio {
  constructor(
    private readonly repositorio: RepositorioServicios,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(comando: ComandoDesactivarServicio): Promise<ServicioDto> {
    const servicio = await this.repositorio.buscarPorId(IdServicio.desde(comando.idServicio));
    if (servicio === null) {
      throw new ServicioNoEncontrado(comando.idServicio);
    }
    if (!servicio.perteneceA(IdBarberia.desde(comando.idBarberiaDelSolicitante))) {
      throw new AccesoNoAutorizado(
        "un administrador solo puede desactivar servicios de su propia barbería.",
      );
    }

    servicio.desactivar(this.reloj.ahora());
    await this.repositorio.guardar(servicio);
    return aServicioDto(servicio);
  }
}
