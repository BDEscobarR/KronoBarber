import { Barberia } from "../modelo/Barberia";
import { EstadoBarberia } from "../modelo/EstadoBarberia";
import { CorreoElectronico } from "../modelo/valores/CorreoElectronico";
import { IdBarberia } from "../modelo/valores/IdBarberia";

/** Filtros opcionales del catálogo público. Ausente significa «no filtrar». */
export interface CriteriosBusquedaBarberias {
  /** Coincidencia exacta con la ciudad de la barbería. */
  readonly ciudad?: string;
  /** Búsqueda parcial sobre el nombre comercial. */
  readonly texto?: string;
}

/**
 * Puerto de salida. Lo declara el dominio con vocabulario de negocio
 * (`guardar`, `buscarPorCorreo`) y lo implementa la infraestructura.
 *
 * Aquí no aparece SQL, ni tablas, ni transacciones: son detalles del
 * adaptador. Este archivo es la plantilla de los repositorios que faltan
 * (servicios, barberos, turnos, clientes).
 *
 * Todo devuelve el **agregado**, nunca filas ni DTO: quien recibe una
 * `Barberia` puede preguntarle sus reglas.
 */
export interface RepositorioBarberias {
  /**
   * Persiste la barbería, exista o no. Es un *upsert*: el mismo método sirve
   * para el alta y para cualquier cambio posterior, porque quien decide qué
   * cambió es el agregado y no el repositorio.
   *
   * Lanza `CorreoDeBarberiaYaRegistrado` si el correo ya está tomado.
   */
  guardar(barberia: Barberia): Promise<void>;

  /** Devuelve `null` si no existe; no lanza. Decidir qué hacer es del caso de uso. */
  buscarPorId(id: IdBarberia): Promise<Barberia | null>;

  /**
   * El correo es la llave natural del registro: se usa para detectar un alta
   * duplicada antes de intentar guardarla. Devuelve `null` si no existe.
   */
  buscarPorCorreo(correo: CorreoElectronico): Promise<Barberia | null>;

  /** Bandeja del operador (CAR-19). Incluye estados no visibles al público. */
  listarPorEstado(estado: EstadoBarberia): Promise<readonly Barberia[]>;

  /**
   * Catálogo público (CAR-07). El filtro por estado es responsabilidad del adaptador
   * como optimización, pero la regla de visibilidad sigue viviendo en el
   * agregado: quien consuma esto debe volver a preguntársela.
   */
  listarHabilitadas(criterios?: CriteriosBusquedaBarberias): Promise<readonly Barberia[]>;
}
