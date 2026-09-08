import { CriteriosBusquedaBarberias, RepositorioBarberias } from "../../../dominio/puertos";
import { BarberiaPublicaDto, aBarberiaPublicaDto } from "../../dto/BarberiaDto";

/**
 * Catálogo público: el cliente solo ve barberías habilitadas (CAR-07, RES-11).
 *
 * OJO al `.filter()` de abajo: parece redundante porque el repositorio ya
 * consultó solo las habilitadas, pero **no lo es y no debe borrarse**. La
 * consulta SQL es una optimización para no traer filas de más; la regla de
 * quién es visible vive en el agregado (`esVisibleParaClientes`). Si mañana
 * se cambia el motor de base de datos o alguien toca el `WHERE`, esta línea
 * es la que impide que se filtre una barbería suspendida al público.
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
