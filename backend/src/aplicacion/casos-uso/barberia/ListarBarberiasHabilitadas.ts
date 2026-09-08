import { CriteriosBusquedaBarberias, RepositorioBarberias } from "../../../dominio/puertos";
import { BarberiaPublicaDto, aBarberiaPublicaDto } from "../../dto/BarberiaDto";

/**
 * Catálogo público: el cliente solo ve barberías habilitadas (CAR-07, RES-11).
 *
 * El filtro se repite sobre el agregado a propósito: la consulta SQL es una
 * optimización, la regla de visibilidad vive en el dominio.
 */
export class ListarBarberiasHabilitadas {
  constructor(private readonly repositorio: RepositorioBarberias) {}

  async ejecutar(
    criterios: CriteriosBusquedaBarberias = {},
  ): Promise<readonly BarberiaPublicaDto[]> {
    const barberias = await this.repositorio.listarHabilitadas(criterios);
    return barberias.filter((barberia) => barberia.esVisibleParaClientes()).map(aBarberiaPublicaDto);
  }
}
