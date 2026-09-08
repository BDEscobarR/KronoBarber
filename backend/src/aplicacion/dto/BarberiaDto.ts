import { Barberia } from "../../dominio/modelo/Barberia";

/**
 * Lo que sale de la aplicación hacia el exterior. El dominio no cruza esta
 * frontera: el controlador HTTP nunca recibe un objeto de valor.
 *
 * Contrato de fechas: los tres instantes salen como texto ISO-8601 en **UTC**
 * (`2026-03-01T10:00:00.000Z`). Quien los muestre es responsable de
 * convertirlos a America/Bogotá (DEP-02); el servidor no envía horas locales.
 *
 * `puedeRecibirReservas` viaja ya resuelto a propósito: el cliente no debe
 * deducirlo comparando el campo `estado`, porque esa regla puede cambiar.
 */
export interface BarberiaDto {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly direccion: string;
  readonly ciudad: string;
  readonly telefono: string;
  readonly correo: string;
  readonly estado: string;
  readonly motivoSuspension: string | null;
  readonly puedeRecibirReservas: boolean;
  readonly registradaEn: string;
  readonly habilitadaEn: string | null;
  readonly actualizadaEn: string;
}

/**
 * Versión reducida para el catálogo público de barberías (CAR-07).
 * Omite el correo y el motivo de suspensión: son datos de gestión, no de vitrina.
 */
export interface BarberiaPublicaDto {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly direccion: string;
  readonly ciudad: string;
  readonly telefono: string;
}

export function aBarberiaDto(barberia: Barberia): BarberiaDto {
  const datos = barberia.instantanea();
  return {
    id: datos.id,
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    direccion: datos.direccion,
    ciudad: datos.ciudad,
    telefono: datos.telefono,
    correo: datos.correo,
    estado: datos.estado,
    motivoSuspension: datos.motivoSuspension,
    puedeRecibirReservas: barberia.puedeRecibirReservas(),
    registradaEn: datos.registradaEn.toISOString(),
    habilitadaEn: datos.habilitadaEn ? datos.habilitadaEn.toISOString() : null,
    actualizadaEn: datos.actualizadaEn.toISOString(),
  };
}

export function aBarberiaPublicaDto(barberia: Barberia): BarberiaPublicaDto {
  const datos = barberia.instantanea();
  return {
    id: datos.id,
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    direccion: datos.direccion,
    ciudad: datos.ciudad,
    telefono: datos.telefono,
  };
}
