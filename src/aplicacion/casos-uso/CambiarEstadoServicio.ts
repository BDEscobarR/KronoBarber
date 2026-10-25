import { ServicioDAO } from '../../dominio/puertos';
import { Servicio } from '../../dominio/modelo/Servicio';

export class CambiarEstadoServicio {
  constructor(private readonly servicioDAO: ServicioDAO) {}

  async ejecutar(id: string, activo: boolean): Promise<Servicio> {
    return await this.servicioDAO.cambiarEstado(id, activo);
  }
}