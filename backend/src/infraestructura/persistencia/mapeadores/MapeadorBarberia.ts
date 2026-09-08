import { Barberia, InstantaneaBarberia } from "../../../dominio/modelo/Barberia";

/**
 * Fila tal como vive en `dbo.barberias`. Los nombres van en snake_case porque
 * son los de la tabla: la traducción a vocabulario de dominio ocurre aquí y
 * en ningún otro sitio.
 */
export interface FilaBarberia {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly direccion: string;
  readonly ciudad: string;
  readonly telefono: string;
  readonly correo: string;
  readonly estado: string;
  readonly motivo_suspension: string | null;
  readonly registrada_en: Date;
  readonly habilitada_en: Date | null;
  readonly actualizada_en: Date;
}

/**
 * Traduce entre la fila de SQL Server y el agregado Barbería.
 *
 * El mapeador nunca construye objetos de valor a mano: delega en
 * `Barberia.reconstituir`, que es quien conoce las invariantes.
 */
export class MapeadorBarberia {
  static aFila(barberia: Barberia): FilaBarberia {
    const datos: InstantaneaBarberia = barberia.instantanea();
    return {
      id: datos.id,
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      direccion: datos.direccion,
      ciudad: datos.ciudad,
      telefono: datos.telefono,
      correo: datos.correo,
      estado: datos.estado,
      motivo_suspension: datos.motivoSuspension,
      registrada_en: datos.registradaEn,
      habilitada_en: datos.habilitadaEn,
      actualizada_en: datos.actualizadaEn,
    };
  }

  static aEntidad(fila: FilaBarberia): Barberia {
    return Barberia.reconstituir({
      id: fila.id,
      nombre: fila.nombre,
      descripcion: fila.descripcion,
      direccion: fila.direccion,
      ciudad: fila.ciudad,
      telefono: fila.telefono,
      correo: fila.correo,
      estado: fila.estado,
      motivoSuspension: fila.motivo_suspension,
      registradaEn: new Date(fila.registrada_en),
      habilitadaEn: fila.habilitada_en === null ? null : new Date(fila.habilitada_en),
      actualizadaEn: new Date(fila.actualizada_en),
    });
  }
}
