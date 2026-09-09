import { ErrorDeValidacion } from "../../../dominio/errores/ErrorDominio";
import { EstadoServicio, esEstadoServicio } from "../../../dominio/modelo/EstadoServicio";
import { IdBarberia } from "../../../dominio/modelo/valores/IdBarberia";
import { CriteriosBusquedaServicios, RepositorioServicios } from "../../../dominio/puertos";
import { ServicioDto, aServicioDto } from "../../dto/ServicioDto";
import { AccesoNoAutorizado } from "../../errores/ErrorAplicacion";

export interface ConsultaListarCatalogo {
  readonly idBarberia: string;
  readonly idBarberiaDelSolicitante: string;
  /** Ausente o vacío significa «todos los estados». */
  readonly estado?: string | undefined;
  readonly texto?: string | undefined;
}

/**
 * Catálogo completo de una barbería, para su administrador (CAR-03).
 *
 * Incluye los servicios inactivos: es la vista de gestión, no la vitrina. El
 * catálogo que ve el cliente es `ListarCatalogoPublico`.
 */
export class ListarCatalogoDeBarberia {
  constructor(private readonly repositorio: RepositorioServicios) {}

  async ejecutar(consulta: ConsultaListarCatalogo): Promise<readonly ServicioDto[]> {
    // RES-02: aislamiento multiempresa.
    if (consulta.idBarberia !== consulta.idBarberiaDelSolicitante) {
      throw new AccesoNoAutorizado(
        "un administrador solo puede consultar el catálogo de su propia barbería.",
      );
    }

    const criterios: CriteriosBusquedaServicios = {
      ...(consulta.estado !== undefined ? { estado: this.exigirEstado(consulta.estado) } : {}),
      ...(consulta.texto !== undefined ? { texto: consulta.texto } : {}),
    };

    const servicios = await this.repositorio.listarDeBarberia(
      IdBarberia.desde(consulta.idBarberia),
      criterios,
    );
    return servicios.map(aServicioDto);
  }

  private exigirEstado(valor: string): EstadoServicio {
    if (!esEstadoServicio(valor)) {
      throw new ErrorDeValidacion(`Estado de servicio desconocido: «${valor}».`);
    }
    return valor;
  }
}
