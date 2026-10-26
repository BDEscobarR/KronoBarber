import { Ausencia, AusenciaDAO, TipoAusencia, UsuarioDAO } from '../../dominio/puertos';

export interface RegistrarAusenciaDTO {
  barberoId: string;
  adminId: string;
  tipo: TipoAusencia;
  desde: Date;
  hasta: Date;
}

export class RegistrarAusencia {
  constructor(
    private readonly ausenciaDAO: AusenciaDAO,
    private readonly usuarioDAO: UsuarioDAO
  ) {}

  async ejecutar(dto: RegistrarAusenciaDTO): Promise<Ausencia> {
    // 1. Validar que la fecha de fin sea estrictamente posterior a la de inicio
    if (new Date(dto.hasta) <= new Date(dto.desde)) {
      throw new Error('La fecha de fin debe ser posterior a la fecha de inicio.');
    }

    // 2. Validar que el administrador exista y esté activo
    const admin = await this.usuarioDAO.porId(dto.adminId);
    if (!admin || admin.rol !== 'ADMINISTRADOR' || !admin.activo) {
      throw new Error('El usuario ejecutor debe ser un ADMINISTRADOR activo.');
    }

    // 3. Validar que el barbero exista y esté activo
    const barbero = await this.usuarioDAO.porId(dto.barberoId);
    if (!barbero || barbero.rol !== 'BARBERO' || !barbero.activo) {
      throw new Error('El barbero especificado no existe o no está activo.');
    }

    // 4. Validar que el administrador pertenezca a la misma barbería que el barbero
    if (admin.barberiaId !== barbero.barberiaId) {
      throw new Error('El administrador solo puede gestionar ausencias de barberos de su propia barbería.');
    }

    // 5. Registrar la ausencia (se permite aunque la barbería esté suspendida D-03)
    const ausencia = new Ausencia({
      barberoId: dto.barberoId,
      tipo: dto.tipo,
      desde: new Date(dto.desde),
      hasta: new Date(dto.hasta),
      estado: 'ACTIVA',
    });

    return await this.ausenciaDAO.guardar(ausencia);
  }
}