import { Barberia } from "../modelo/Barberia";
import { EstadoBarberia } from "../modelo/EstadoBarberia";
import { CorreoElectronico } from "../modelo/valores/CorreoElectronico";
import { IdBarberia } from "../modelo/valores/IdBarberia";

export interface CriteriosBusquedaBarberias {
  readonly ciudad?: string;
  readonly texto?: string;
}

/**
 * Puerto de salida. Lo declara el dominio con vocabulario de negocio
 * (`guardar`, `buscarPorCorreo`) y lo implementa la infraestructura.
 */
export interface RepositorioBarberias {
  guardar(barberia: Barberia): Promise<void>;
  buscarPorId(id: IdBarberia): Promise<Barberia | null>;
  buscarPorCorreo(correo: CorreoElectronico): Promise<Barberia | null>;
  listarPorEstado(estado: EstadoBarberia): Promise<readonly Barberia[]>;
  listarHabilitadas(criterios?: CriteriosBusquedaBarberias): Promise<readonly Barberia[]>;
}
