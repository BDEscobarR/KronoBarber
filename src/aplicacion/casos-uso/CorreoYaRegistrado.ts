/** Error de negocio compartido cuando un correo ya identifica un registro existente. */
export class CorreoYaRegistrado extends Error {
  /** @param correo Correo repetido, ya normalizado. */
  constructor(correo: string) {
    super(`Ya existe un registro con el correo ${correo}`)
  }
}
