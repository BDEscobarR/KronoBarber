import { CorreoElectronico } from "./CorreoElectronico";
import { Telefono } from "./Telefono";

/**
 * Agrupa los medios por los que un cliente o el operador de la plataforma
 * pueden comunicarse con la barbería. El correo es además la llave natural
 * con la que se detecta un registro duplicado.
 */
export class MediosContacto {
  private constructor(
    private readonly telefono: Telefono,
    private readonly correo: CorreoElectronico,
  ) {}

  static desde(telefono: Telefono, correo: CorreoElectronico): MediosContacto {
    return new MediosContacto(telefono, correo);
  }

  static desdePrimitivos(telefono: string, correo: string): MediosContacto {
    return new MediosContacto(Telefono.desde(telefono), CorreoElectronico.desde(correo));
  }

  get telefonoContacto(): Telefono {
    return this.telefono;
  }

  get correoContacto(): CorreoElectronico {
    return this.correo;
  }
}
