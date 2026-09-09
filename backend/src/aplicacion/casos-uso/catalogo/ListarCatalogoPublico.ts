import { IdBarberia } from "../../../dominio/modelo/valores/IdBarberia";
import { RepositorioBarberias, RepositorioServicios } from "../../../dominio/puertos";
import { ServicioPublicoDto, aServicioPublicoDto } from "../../dto/ServicioDto";
import { BarberiaNoEncontrada } from "../../errores/ErrorAplicacion";

export interface ConsultaCatalogoPublico {
  readonly idBarberia: string;
}

/**
 * Catálogo que ve el cliente antes de elegir barbero y horario (CAR-07).
 *
 * Dos filtros, y ninguno sobra:
 *
 *  1. **La barbería debe ser visible** (RES-11). Si no lo es, se responde
 *     «no encontrada» y no «no habilitada»: que un establecimiento esté
 *     suspendido es información de gestión y no tiene por qué llegarle a un
 *     visitante cualquiera.
 *  2. **El servicio debe ser visible.** El `.filter()` parece redundante
 *     porque el repositorio ya consultó solo los activos, pero no lo es y no
 *     debe borrarse: la consulta SQL es una optimización, mientras que la
 *     regla de quién se publica vive en el agregado. Es la misma decisión que
 *     documenta `ListarBarberiasHabilitadas`.
 */
export class ListarCatalogoPublico {
  constructor(
    private readonly repositorioServicios: RepositorioServicios,
    private readonly repositorioBarberias: RepositorioBarberias,
  ) {}

  async ejecutar(consulta: ConsultaCatalogoPublico): Promise<readonly ServicioPublicoDto[]> {
    const idBarberia = IdBarberia.desde(consulta.idBarberia);

    const barberia = await this.repositorioBarberias.buscarPorId(idBarberia);
    if (barberia === null || !barberia.esVisibleParaClientes()) {
      throw new BarberiaNoEncontrada(consulta.idBarberia);
    }

    const servicios = await this.repositorioServicios.listarActivosDeBarberia(idBarberia);
    return servicios.filter((servicio) => servicio.esVisibleParaClientes()).map(aServicioPublicoDto);
  }
}
