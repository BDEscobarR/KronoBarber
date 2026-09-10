import type { PrismaClient } from './generado/client'
import type { BarberiaModel as FilaBarberia } from './generado/models'
import { esEstadoBarberia, type Barberia, type BarberiaNueva, type EstadoBarberia } from '../../dominio/modelo/Barberia'
import type { BarberiaDAO } from '../../dominio/puertos'

// SQL Server no tiene enums en Prisma: `estado` llega como texto libre y se comprueba
// aquí, antes de entrar al dominio como `EstadoBarberia`.
const aDominio = (fila: FilaBarberia): Barberia => {
  if (!esEstadoBarberia(fila.estado)) throw new Error(`Estado de barbería desconocido: ${fila.estado}`)
  return {
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    direccion: fila.direccion,
    ciudad: fila.ciudad,
    telefono: fila.telefono,
    correo: fila.correo,
    estado: fila.estado,
    motivoSuspension: fila.motivoSuspension,
  }
}

export class BarberiaDAOPrisma implements BarberiaDAO {
  constructor(private readonly prisma: PrismaClient) {}

  async guardar(barberia: BarberiaNueva): Promise<Barberia> {
    return aDominio(await this.prisma.barberia.create({ data: barberia }))
  }

  async porId(id: string): Promise<Barberia | null> {
    const fila = await this.prisma.barberia.findUnique({ where: { id } })
    return fila && aDominio(fila)
  }

  async porCorreo(correo: string): Promise<Barberia | null> {
    const fila = await this.prisma.barberia.findUnique({ where: { correo } })
    return fila && aDominio(fila)
  }

  async habilitadas(ciudad: string | null): Promise<Barberia[]> {
    const filas = await this.prisma.barberia.findMany({
      where: { estado: 'HABILITADA', ...(ciudad === null ? {} : { ciudad }) },
      orderBy: { nombre: 'asc' },
    })
    return filas.map(aDominio)
  }

  async cambiarEstado(id: string, estado: EstadoBarberia, motivoSuspension: string | null): Promise<Barberia> {
    return aDominio(await this.prisma.barberia.update({ where: { id }, data: { estado, motivoSuspension } }))
  }
}
