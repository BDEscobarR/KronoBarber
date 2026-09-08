import { IdBarberia } from "../../../dominio/modelo/valores/IdBarberia";
import { Reloj, RepositorioBarberias } from "../../../dominio/puertos";
import { BarberiaDto, aBarberiaDto } from "../../dto/BarberiaDto";
import { BarberiaNoEncontrada } from "../../errores/ErrorAplicacion";

export interface ComandoHabilitarBarberia {
  readonly idBarberia: string;
  readonly idOperador: string;
}

/**
 * El operador verifica la barbería y autoriza que reciba reservas (CAR-02).
 * A partir de aquí es visible en el catálogo público (RES-11).
 */
export class HabilitarBarberia {
  constructor(
    private readonly repositorio: RepositorioBarberias,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(comando: ComandoHabilitarBarberia): Promise<BarberiaDto> {
    const barberia = await this.repositorio.buscarPorId(IdBarberia.desde(comando.idBarberia));
    if (barberia === null) {
      throw new BarberiaNoEncontrada(comando.idBarberia);
    }

    barberia.habilitar(this.reloj.ahora());
    await this.repositorio.guardar(barberia);
    return aBarberiaDto(barberia);
  }
}
