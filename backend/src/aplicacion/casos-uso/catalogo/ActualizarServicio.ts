import { FichaServicio } from "../../../dominio/modelo/Servicio";
import { DescripcionServicio } from "../../../dominio/modelo/valores/DescripcionServicio";
import { Dinero } from "../../../dominio/modelo/valores/Dinero";
import { Duracion } from "../../../dominio/modelo/valores/Duracion";
import { IdBarberia } from "../../../dominio/modelo/valores/IdBarberia";
import { IdServicio } from "../../../dominio/modelo/valores/IdServicio";
import { NombreServicio } from "../../../dominio/modelo/valores/NombreServicio";
import { Reloj, RepositorioServicios } from "../../../dominio/puertos";
import { ServicioDto, aServicioDto } from "../../dto/ServicioDto";
import {
  AccesoNoAutorizado,
  NombreDeServicioYaRegistrado,
  ServicioNoEncontrado,
} from "../../errores/ErrorAplicacion";

export interface ComandoActualizarServicio {
  readonly idServicio: string;
  readonly idBarberiaDelSolicitante: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly precio: number;
  readonly duracionMinutos: number;
}

/**
 * Mantenimiento de la ficha del servicio por el administrador (CAR-03).
 *
 * Cambiar precio o duración aquí no reescribe los turnos ya reservados: el
 * turno guarda lo pactado en el momento de la reserva (RES-14).
 */
export class ActualizarServicio {
  constructor(
    private readonly repositorio: RepositorioServicios,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(comando: ComandoActualizarServicio): Promise<ServicioDto> {
    const servicio = await this.repositorio.buscarPorId(IdServicio.desde(comando.idServicio));
    if (servicio === null) {
      throw new ServicioNoEncontrado(comando.idServicio);
    }

    // RES-02: aislamiento multiempresa. Lo responde el agregado, no este caso de uso.
    if (!servicio.perteneceA(IdBarberia.desde(comando.idBarberiaDelSolicitante))) {
      throw new AccesoNoAutorizado(
        "un administrador solo puede modificar servicios de su propia barbería.",
      );
    }

    const nombre = NombreServicio.desde(comando.nombre);

    // Renombrar no puede pisar a otro servicio del mismo catálogo. Que el
    // repetido sea este mismo servicio es el caso normal: se está guardando el
    // formulario sin cambiar el nombre.
    const repetido = await this.repositorio.buscarPorNombreEnBarberia(
      servicio.barberiaPropietaria,
      nombre,
    );
    if (repetido !== null && !repetido.identificador.esIgualA(servicio.identificador)) {
      throw new NombreDeServicioYaRegistrado(nombre.valorPrimitivo);
    }

    const ficha: FichaServicio = {
      nombre,
      descripcion: DescripcionServicio.desde(comando.descripcion),
      precio: Dinero.desdePesos(comando.precio),
      duracion: Duracion.desdeMinutos(comando.duracionMinutos),
    };

    servicio.actualizarFicha(ficha, this.reloj.ahora());
    await this.repositorio.guardar(servicio);
    return aServicioDto(servicio);
  }
}
