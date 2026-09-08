import { FichaServicio, Servicio } from "../../../dominio/modelo/Servicio";
import { DescripcionServicio } from "../../../dominio/modelo/valores/DescripcionServicio";
import { Dinero } from "../../../dominio/modelo/valores/Dinero";
import { Duracion } from "../../../dominio/modelo/valores/Duracion";
import { IdBarberia } from "../../../dominio/modelo/valores/IdBarberia";
import { IdServicio } from "../../../dominio/modelo/valores/IdServicio";
import { NombreServicio } from "../../../dominio/modelo/valores/NombreServicio";
import {
  GeneradorId,
  Reloj,
  RepositorioBarberias,
  RepositorioServicios,
} from "../../../dominio/puertos";
import { ServicioDto, aServicioDto } from "../../dto/ServicioDto";
import {
  AccesoNoAutorizado,
  BarberiaNoEncontrada,
  NombreDeServicioYaRegistrado,
} from "../../errores/ErrorAplicacion";

export interface ComandoCrearServicio {
  readonly idBarberia: string;
  readonly idBarberiaDelSolicitante: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly precio: number;
  readonly duracionMinutos: number;
}

/**
 * Alta de un servicio en el catálogo de una barbería (CAR-03).
 *
 * Depende de dos puertos, y eso es correcto: el catálogo no puede colgar de
 * una barbería que no existe. La comprobación es de orquestación —solo se
 * descubre consultando el repositorio—, no una regla del agregado.
 *
 * No se exige que la barbería esté habilitada: configurar el catálogo es parte
 * de la puesta en marcha (Visión §4.4) y lo que RES-11 condiciona es la
 * visibilidad y las reservas, no la configuración. Un catálogo de una barbería
 * no habilitada simplemente no lo ve nadie.
 */
export class CrearServicio {
  constructor(
    private readonly repositorioServicios: RepositorioServicios,
    private readonly repositorioBarberias: RepositorioBarberias,
    private readonly generadorId: GeneradorId,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(comando: ComandoCrearServicio): Promise<ServicioDto> {
    // RES-02: aislamiento multiempresa. Un administrador solo toca su catálogo.
    if (comando.idBarberia !== comando.idBarberiaDelSolicitante) {
      throw new AccesoNoAutorizado(
        "un administrador solo puede crear servicios en su propia barbería.",
      );
    }

    const idBarberia = IdBarberia.desde(comando.idBarberia);
    const barberia = await this.repositorioBarberias.buscarPorId(idBarberia);
    if (barberia === null) {
      throw new BarberiaNoEncontrada(comando.idBarberia);
    }

    const nombre = NombreServicio.desde(comando.nombre);
    const repetido = await this.repositorioServicios.buscarPorNombreEnBarberia(idBarberia, nombre);
    if (repetido !== null) {
      throw new NombreDeServicioYaRegistrado(nombre.valorPrimitivo);
    }

    const ficha: FichaServicio = {
      nombre,
      descripcion: DescripcionServicio.desde(comando.descripcion),
      precio: Dinero.desdePesos(comando.precio),
      duracion: Duracion.desdeMinutos(comando.duracionMinutos),
    };

    const servicio = Servicio.crear(
      IdServicio.desde(this.generadorId.nuevo()),
      idBarberia,
      ficha,
      this.reloj.ahora(),
    );

    await this.repositorioServicios.guardar(servicio);
    return aServicioDto(servicio);
  }
}
