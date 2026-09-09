import { EstadoServicio } from "../modelo/EstadoServicio";
import { Servicio } from "../modelo/Servicio";
import { IdBarberia } from "../modelo/valores/IdBarberia";
import { IdServicio } from "../modelo/valores/IdServicio";
import { NombreServicio } from "../modelo/valores/NombreServicio";

/** Filtros opcionales del catálogo. Ausente significa «no filtrar». */
export interface CriteriosBusquedaServicios {
  /** Estado exacto del servicio. Solo tiene sentido para el administrador. */
  readonly estado?: EstadoServicio;
  /** Búsqueda parcial sobre el nombre del servicio. */
  readonly texto?: string;
}

/**
 * Puerto de salida del catálogo (CAR-03). Lo declara el dominio con
 * vocabulario de negocio y lo implementa la infraestructura.
 *
 * **Todas las consultas cuelgan de una barbería.** No existe un
 * `listarTodos()`: sería la puerta por la que se escapa el aislamiento
 * multiempresa (RES-02). Si alguna vez hace falta una vista global, es del
 * operador de la plataforma y se declara como tal.
 *
 * Todo devuelve el **agregado**, nunca filas ni DTO: quien recibe un
 * `Servicio` puede preguntarle sus reglas.
 */
export interface RepositorioServicios {
  /**
   * Persiste el servicio, exista o no. Es un *upsert*, igual que en barberías:
   * quien decide qué cambió es el agregado y no el repositorio.
   *
   * Lanza `NombreDeServicioYaRegistrado` si la barbería ya tiene otro servicio
   * con ese nombre.
   */
  guardar(servicio: Servicio): Promise<void>;

  /** Devuelve `null` si no existe; no lanza. Decidir qué hacer es del caso de uso. */
  buscarPorId(id: IdServicio): Promise<Servicio | null>;

  /**
   * El nombre es la llave natural **dentro de una barbería**: dos barberías
   * distintas pueden ofrecer «Corte clásico» sin conflicto. Se usa para
   * detectar un alta duplicada antes de intentar guardarla.
   */
  buscarPorNombreEnBarberia(
    idBarberia: IdBarberia,
    nombre: NombreServicio,
  ): Promise<Servicio | null>;

  /** Catálogo completo de la barbería, para su administrador (CAR-03). */
  listarDeBarberia(
    idBarberia: IdBarberia,
    criterios?: CriteriosBusquedaServicios,
  ): Promise<readonly Servicio[]>;

  /**
   * Catálogo público de una barbería (CAR-07). El filtro por estado es una
   * optimización del adaptador; la regla de visibilidad sigue viviendo en el
   * agregado, así que quien consuma esto debe volver a preguntársela.
   */
  listarActivosDeBarberia(idBarberia: IdBarberia): Promise<readonly Servicio[]>;
}
