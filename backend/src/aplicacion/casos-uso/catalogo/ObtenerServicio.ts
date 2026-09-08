import { IdBarberia } from "../../../dominio/modelo/valores/IdBarberia";
import { IdServicio } from "../../../dominio/modelo/valores/IdServicio";
import { RepositorioServicios } from "../../../dominio/puertos";
import { ServicioDto, aServicioDto } from "../../dto/ServicioDto";
import { AccesoNoAutorizado, ServicioNoEncontrado } from "../../errores/ErrorAplicacion";

export interface ConsultaObtenerServicio {
  readonly idServicio: string;
  readonly idBarberiaDelSolicitante: string;
}

/** Detalle completo de un servicio, para el administrador de su barbería. */
export class ObtenerServicio {
  constructor(private readonly repositorio: RepositorioServicios) {}

  async ejecutar(consulta: ConsultaObtenerServicio): Promise<ServicioDto> {
    const servicio = await this.repositorio.buscarPorId(IdServicio.desde(consulta.idServicio));
    if (servicio === null) {
      throw new ServicioNoEncontrado(consulta.idServicio);
    }
    if (!servicio.perteneceA(IdBarberia.desde(consulta.idBarberiaDelSolicitante))) {
      throw new AccesoNoAutorizado(
        "un administrador solo puede consultar servicios de su propia barbería.",
      );
    }
    return aServicioDto(servicio);
  }
}
