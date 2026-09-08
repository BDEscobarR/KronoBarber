import { IdBarberia } from "../../../dominio/modelo/valores/IdBarberia";
import { RepositorioBarberias } from "../../../dominio/puertos";
import { BarberiaDto, aBarberiaDto } from "../../dto/BarberiaDto";
import { BarberiaNoEncontrada } from "../../errores/ErrorAplicacion";

export interface ConsultaObtenerBarberia {
  readonly idBarberia: string;
}

/** Detalle completo de una barbería, para el administrador y el operador. */
export class ObtenerBarberia {
  constructor(private readonly repositorio: RepositorioBarberias) {}

  async ejecutar(consulta: ConsultaObtenerBarberia): Promise<BarberiaDto> {
    const barberia = await this.repositorio.buscarPorId(IdBarberia.desde(consulta.idBarberia));
    if (barberia === null) {
      throw new BarberiaNoEncontrada(consulta.idBarberia);
    }
    return aBarberiaDto(barberia);
  }
}
