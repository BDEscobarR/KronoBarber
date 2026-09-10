import { normalizarTelefono, type Barberia } from '../../dominio/modelo/Barberia'
import type { BarberiaDAO } from '../../dominio/puertos'

export class CorreoDeBarberiaYaRegistrado extends Error {
  constructor(correo: string) {
    super(`Ya existe una barbería registrada con el correo ${correo}`)
  }
}

/** Datos de entrada del registro de una barbería, ya validados en la frontera HTTP. */
export interface RegistroBarberiaDTO {
  nombre: string
  descripcion: string
  direccion: string
  ciudad: string
  telefono: string
  correo: string
}

export class RegistrarBarberia {
  constructor(private readonly barberias: BarberiaDAO) {}

  async ejecutar(datos: RegistroBarberiaDTO): Promise<Barberia> {
    const correo = datos.correo.trim().toLowerCase()
    if (await this.barberias.porCorreo(correo)) throw new CorreoDeBarberiaYaRegistrado(correo)

    // Nace pendiente: nadie puede registrarla habilitada, eso lo decide el operador (CAR-02).
    return this.barberias.guardar({
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
      direccion: datos.direccion.trim(),
      ciudad: datos.ciudad.trim(),
      telefono: normalizarTelefono(datos.telefono),
      correo,
      estado: 'PENDIENTE_VERIFICACION',
      motivoSuspension: null,
    })
  }
}
