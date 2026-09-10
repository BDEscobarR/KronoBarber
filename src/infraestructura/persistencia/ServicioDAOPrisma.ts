import type { PrismaClient } from './generado/client'
import type { ServicioModel as FilaServicio } from './generado/models'
import type { Servicio, ServicioNuevo } from '../../dominio/modelo/Servicio'
import type { ServicioDAO } from '../../dominio/puertos'

const aDominio = (fila: FilaServicio): Servicio => ({
  id: fila.id,
  barberiaId: fila.barberiaId,
  nombre: fila.nombre,
  descripcion: fila.descripcion,
  precio: fila.precio,
  duracionMinutos: fila.duracionMinutos,
  activo: fila.activo,
})

export class ServicioDAOPrisma implements ServicioDAO {
  constructor(private readonly prisma: PrismaClient) {}

  async guardar(servicio: ServicioNuevo): Promise<Servicio> {
    return aDominio(await this.prisma.servicio.create({ data: servicio }))
  }

  // La intercalación de SQL Server no distingue mayúsculas: «Corte clásico» y
  // «CORTE CLÁSICO» son el mismo nombre, que es justo lo que pide la regla.
  async porNombre(barberiaId: string, nombre: string): Promise<Servicio | null> {
    const fila = await this.prisma.servicio.findUnique({ where: { barberiaId_nombre: { barberiaId, nombre } } })
    return fila && aDominio(fila)
  }

  async activosDe(barberiaId: string): Promise<Servicio[]> {
    const filas = await this.prisma.servicio.findMany({
      where: { barberiaId, activo: true },
      orderBy: { nombre: 'asc' },
    })
    return filas.map(aDominio)
  }
}
