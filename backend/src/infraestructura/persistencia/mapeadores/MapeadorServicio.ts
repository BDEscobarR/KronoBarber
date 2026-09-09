import { InstantaneaServicio, Servicio } from "../../../dominio/modelo/Servicio";

/**
 * Fila tal como vive en `dbo.servicios`. Los nombres van en snake_case porque
 * son los de la tabla: la traducción a vocabulario de dominio ocurre aquí y
 * en ningún otro sitio.
 */
export interface FilaServicio {
  readonly id: string;
  readonly id_barberia: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly precio: number;
  readonly duracion_minutos: number;
  readonly estado: string;
  readonly creado_en: Date;
  readonly actualizado_en: Date;
}

/**
 * Traduce entre la fila de SQL Server y el agregado Servicio.
 *
 * El mapeador nunca construye objetos de valor a mano: delega en
 * `Servicio.reconstituir`, que es quien conoce las invariantes.
 *
 * `precio` es INT en la base y son **pesos colombianos enteros**, no centavos:
 * el número de la columna es el mismo que ve el cliente. El `Number(...)` es
 * explícito porque el driver puede entregar un valor numérico como cadena
 * según el tipo, y aquí conviene que la conversión se vea.
 */
export class MapeadorServicio {
  static aFila(servicio: Servicio): FilaServicio {
    const datos: InstantaneaServicio = servicio.instantanea();
    return {
      id: datos.id,
      id_barberia: datos.idBarberia,
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      precio: datos.precio,
      duracion_minutos: datos.duracionMinutos,
      estado: datos.estado,
      creado_en: datos.creadoEn,
      actualizado_en: datos.actualizadoEn,
    };
  }

  static aEntidad(fila: FilaServicio): Servicio {
    return Servicio.reconstituir({
      id: fila.id,
      idBarberia: fila.id_barberia,
      nombre: fila.nombre,
      descripcion: fila.descripcion,
      precio: Number(fila.precio),
      duracionMinutos: Number(fila.duracion_minutos),
      estado: fila.estado,
      creadoEn: new Date(fila.creado_en),
      actualizadoEn: new Date(fila.actualizado_en),
    });
  }
}
