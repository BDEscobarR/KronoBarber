import { Barberia, PerfilBarberia } from "../../../dominio/modelo/Barberia";
import { CorreoElectronico } from "../../../dominio/modelo/valores/CorreoElectronico";
import { DescripcionBarberia } from "../../../dominio/modelo/valores/DescripcionBarberia";
import { IdBarberia } from "../../../dominio/modelo/valores/IdBarberia";
import { MediosContacto } from "../../../dominio/modelo/valores/MediosContacto";
import { NombreBarberia } from "../../../dominio/modelo/valores/NombreBarberia";
import { Telefono } from "../../../dominio/modelo/valores/Telefono";
import { Ubicacion } from "../../../dominio/modelo/valores/Ubicacion";
import { GeneradorId, Reloj, RepositorioBarberias } from "../../../dominio/puertos";
import { BarberiaDto, aBarberiaDto } from "../../dto/BarberiaDto";
import { CorreoDeBarberiaYaRegistrado } from "../../errores/ErrorAplicacion";

export interface ComandoRegistrarBarberia {
  readonly nombre: string;
  readonly descripcion: string;
  readonly direccion: string;
  readonly ciudad: string;
  readonly telefono: string;
  readonly correo: string;
}

/**
 * Alta de una barbería en la plataforma (CAR-01).
 *
 * Queda en PENDIENTE_VERIFICACION: no es visible ni recibe reservas hasta que
 * el operador la habilite (RES-11, CAR-02).
 */
export class RegistrarBarberia {
  constructor(
    private readonly repositorio: RepositorioBarberias,
    private readonly generadorId: GeneradorId,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(comando: ComandoRegistrarBarberia): Promise<BarberiaDto> {
    const correo = CorreoElectronico.desde(comando.correo);

    const yaRegistrada = await this.repositorio.buscarPorCorreo(correo);
    if (yaRegistrada !== null) {
      throw new CorreoDeBarberiaYaRegistrado(correo.valorPrimitivo);
    }

    const perfil: PerfilBarberia = {
      nombre: NombreBarberia.desde(comando.nombre),
      descripcion: DescripcionBarberia.desde(comando.descripcion),
      ubicacion: Ubicacion.desde({ direccion: comando.direccion, ciudad: comando.ciudad }),
      contacto: MediosContacto.desde(Telefono.desde(comando.telefono), correo),
    };

    const barberia = Barberia.registrar(
      IdBarberia.desde(this.generadorId.nuevo()),
      perfil,
      this.reloj.ahora(),
    );

    await this.repositorio.guardar(barberia);
    return aBarberiaDto(barberia);
  }
}
