import type { AusenciaDAO } from '../../dominio/puertos/AusenciaDAO'
import { validarAusencia, TipoAusencia } from '../../dominio/modelo/Ausencia'

export interface PeticionRegistrarAusencia {
  barberoId: string
  tipo: string
  desde: Date
  hasta: Date
  rolUsuarioActual: string
}

export class RegistrarAusencia {
  constructor(private readonly ausenciaDAO: AusenciaDAO) {}

  async ejecutar(peticion: PeticionRegistrarAusencia) {
    // 1. Verificación de permisos de seguridad
    if (peticion.rolUsuarioActual !== 'ADMINISTRADOR') {
      throw new Error('No autorizado: Solo los administradores pueden registrar ausencias.')
    }

    const nuevaAusencia = {
      barberoId: peticion.barberoId,
      tipo: peticion.tipo as TipoAusencia,
      desde: peticion.desde,
      hasta: peticion.hasta
    }

    // 2. Ejecutar validaciones puras del dominio (fechas y tipos)
    validarAusencia(nuevaAusencia)

    // 3. Persistir en la base de datos a través del puerto
    return await this.ausenciaDAO.guardar(nuevaAusencia)
  }
}