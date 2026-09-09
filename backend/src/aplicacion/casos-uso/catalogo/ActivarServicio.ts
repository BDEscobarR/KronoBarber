import { IdBarberia } from "../../../dominio/modelo/valores/IdBarberia";
import { IdServicio } from "../../../dominio/modelo/valores/IdServicio";
import { Reloj, RepositorioServicios } from "../../../dominio/puertos";
import { ServicioDto, aServicioDto } from "../../dto/ServicioDto";
import { AccesoNoAutorizado, ServicioNoEncontrado } from "../../errores/ErrorAplicacion";

export interface ComandoActivarServicio {
  readonly idServicio: string;
  readonly idBarberiaDelSolicitante: string;
}

/**
 * El administrador vuelve a publicar un servicio retirado (CAR-03).
 * Que activar dos veces sea un error lo decide el agregado, no este archivo.
 */
export class ActivarServicio {
  constructor(
    private readonly repositorio: RepositorioServicios,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(comando: ComandoActivarServicio): Promise<ServicioDto> {
    const servicio = await this.repositorio.buscarPorId(IdServicio.desde(comando.idServicio));
    if (servicio === null) {
      throw new ServicioNoEncontrado(comando.idServicio);
    }
    if (!servicio.perteneceA(IdBarberia.desde(comando.idBarberiaDelSolicitante))) {
      throw new AccesoNoAutorizado(
        "un administrador solo puede activar servicios de su propia barbería.",
      );
    }

    servicio.activar(this.reloj.ahora());
    await this.repositorio.guardar(servicio);
    return aServicioDto(servicio);
  }
}
