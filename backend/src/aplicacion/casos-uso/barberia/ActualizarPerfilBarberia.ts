import { PerfilBarberia } from "../../../dominio/modelo/Barberia";
import { DescripcionBarberia } from "../../../dominio/modelo/valores/DescripcionBarberia";
import { IdBarberia } from "../../../dominio/modelo/valores/IdBarberia";
import { MediosContacto } from "../../../dominio/modelo/valores/MediosContacto";
import { NombreBarberia } from "../../../dominio/modelo/valores/NombreBarberia";
import { Telefono } from "../../../dominio/modelo/valores/Telefono";
import { Ubicacion } from "../../../dominio/modelo/valores/Ubicacion";
import { Reloj, RepositorioBarberias } from "../../../dominio/puertos";
import { BarberiaDto, aBarberiaDto } from "../../dto/BarberiaDto";
import { AccesoNoAutorizado, BarberiaNoEncontrada } from "../../errores/ErrorAplicacion";

export interface ComandoActualizarPerfilBarberia {
  readonly idBarberia: string;
  readonly idBarberiaDelSolicitante: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly direccion: string;
  readonly ciudad: string;
  readonly telefono: string;
}

/**
 * Mantenimiento del perfil por el administrador (CAR-01).
 *
 * El correo no se cambia aquí: es la llave natural del registro y su cambio
 * exigiría reverificación por parte del operador.
 */
export class ActualizarPerfilBarberia {
  constructor(
    private readonly repositorio: RepositorioBarberias,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(comando: ComandoActualizarPerfilBarberia): Promise<BarberiaDto> {
    // RES-02: aislamiento multiempresa. Un administrador solo toca su barbería.
    if (comando.idBarberia !== comando.idBarberiaDelSolicitante) {
      throw new AccesoNoAutorizado("un administrador solo puede modificar su propia barbería.");
    }

    const barberia = await this.repositorio.buscarPorId(IdBarberia.desde(comando.idBarberia));
    if (barberia === null) {
      throw new BarberiaNoEncontrada(comando.idBarberia);
    }

    const perfil: PerfilBarberia = {
      nombre: NombreBarberia.desde(comando.nombre),
      descripcion: DescripcionBarberia.desde(comando.descripcion),
      ubicacion: Ubicacion.desde({ direccion: comando.direccion, ciudad: comando.ciudad }),
      contacto: MediosContacto.desde(Telefono.desde(comando.telefono), barberia.correoDeContacto),
    };

    barberia.actualizarPerfil(perfil, this.reloj.ahora());
    await this.repositorio.guardar(barberia);
    return aBarberiaDto(barberia);
  }
}
