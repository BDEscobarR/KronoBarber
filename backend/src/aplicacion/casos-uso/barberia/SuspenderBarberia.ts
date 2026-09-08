import { IdBarberia } from "../../../dominio/modelo/valores/IdBarberia";
import { Reloj, RepositorioBarberias } from "../../../dominio/puertos";
import { BarberiaDto, aBarberiaDto } from "../../dto/BarberiaDto";
import { BarberiaNoEncontrada } from "../../errores/ErrorAplicacion";

export interface ComandoSuspenderBarberia {
  readonly idBarberia: string;
  readonly idOperador: string;
  readonly motivo: string;
}

/**
 * Suspensión por incumplir las políticas de uso (CAR-02).
 * El motivo es obligatorio: lo exige el agregado, no este caso de uso.
 */
export class SuspenderBarberia {
  constructor(
    private readonly repositorio: RepositorioBarberias,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(comando: ComandoSuspenderBarberia): Promise<BarberiaDto> {
    const barberia = await this.repositorio.buscarPorId(IdBarberia.desde(comando.idBarberia));
    if (barberia === null) {
      throw new BarberiaNoEncontrada(comando.idBarberia);
    }

    barberia.suspender(comando.motivo, this.reloj.ahora());
    await this.repositorio.guardar(barberia);
    return aBarberiaDto(barberia);
  }
}
