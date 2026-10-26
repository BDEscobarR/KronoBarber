import { UsuarioDAO, ServicioDAO } from '../../dominio/puertos';

export class AsignarServiciosBarbero {
  constructor(
    private usuarioDAO: UsuarioDAO,
    private servicioDAO: ServicioDAO,
  ) {}

  async ejecutar(barberoId: string, servicioIds: string[]) {
    // 1. Validar que el usuario existe usando 'porId'
    const usuario = await this.usuarioDAO.porId(barberoId);
    if (!usuario) {
      throw new Error('El usuario especificado no existe.');
    }

    // 2. Regla pura de dominio: Debe ser rol BARBERO y estar activo
    if (usuario.rol !== 'BARBERO' || !usuario.activo) {
      throw new Error('Solo un usuario BARBERO activo puede tener servicios asignados.');
    }

    // 3. Regla pura de dominio: Los servicios deben pertenecer a la barbería del barbero
    for (const servicioId of servicioIds) {
      const servicio = await this.servicioDAO.porId(servicioId);
      if (!servicio) {
        throw new Error(`El servicio con ID ${servicioId} no existe.`);
      }
      if (servicio.barberiaId !== usuario.barberiaId) {
        throw new Error(`El servicio '${servicio.nombre}' no pertenece a la barbería del barbero.`);
      }
    }

    // 4. Persistir las asignaciones
    await this.servicioDAO.asignarABarbero(barberoId, servicioIds);

    return { mensaje: 'Servicios asignados correctamente al barbero.' };
  }
}