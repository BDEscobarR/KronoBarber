import { ErrorDeValidacion } from "../../../dominio/errores/ErrorDominio";
import { EstadoBarberia, esEstadoBarberia } from "../../../dominio/modelo/EstadoBarberia";
import { RepositorioBarberias } from "../../../dominio/puertos";
import { BarberiaDto, aBarberiaDto } from "../../dto/BarberiaDto";

export interface ConsultaListarPorEstado {
  readonly estado: string;
}

/** Supervisión: el operador revisa la bandeja de barberías por estado (CAR-19). */
export class ListarBarberiasPorEstado {
  constructor(private readonly repositorio: RepositorioBarberias) {}

  async ejecutar(consulta: ConsultaListarPorEstado): Promise<readonly BarberiaDto[]> {
    if (!esEstadoBarberia(consulta.estado)) {
      throw new ErrorDeValidacion(`Estado desconocido: «${consulta.estado}».`);
    }
    const estado: EstadoBarberia = consulta.estado;
    const barberias = await this.repositorio.listarPorEstado(estado);
    return barberias.map(aBarberiaDto);
  }
}
