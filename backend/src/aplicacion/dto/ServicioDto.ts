import { Servicio } from "../../dominio/modelo/Servicio";

/**
 * Lo que sale de la aplicación hacia el exterior. El dominio no cruza esta
 * frontera: el controlador HTTP nunca recibe un objeto de valor.
 *
 * **Contrato de dinero**: los importes viajan en **pesos colombianos enteros**
 * y con la moneda declarada. `35000` es $35.000. No se envía «$ 35.000» ya
 * formateado ni un decimal: dar formato es del cliente (DEP-02 hace lo mismo
 * con las fechas), y un `35000.0` en punto flotante es exactamente lo que
 * `Dinero` existe para evitar.
 *
 * `anticipo` y `saldo` viajan ya resueltos a propósito: el cliente **no** debe
 * multiplicar por 0,2 en el navegador. La regla es del servidor (RES-03) y el
 * README lo pide explícitamente —«ninguna regla de negocio se reimplementa en
 * React»—, además de que RES-14 obliga a mostrar el reparto antes de pagar.
 *
 * Los dos siempre suman `precio` exactamente: el anticipo se redondea al peso
 * y el saldo se calcula restando, nunca con un segundo porcentaje.
 *
 * Contrato de fechas: los instantes salen como texto ISO-8601 en **UTC**.
 */
export interface ServicioDto {
  readonly id: string;
  readonly idBarberia: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly precio: number;
  readonly moneda: "COP";
  readonly duracionMinutos: number;
  readonly anticipo: number;
  readonly saldo: number;
  readonly estado: string;
  readonly puedeReservarse: boolean;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
}

/**
 * Versión reducida para el catálogo público de una barbería (CAR-07).
 * Omite el estado y las fechas de gestión: al cliente solo le llega lo que
 * necesita para elegir y saber cuánto paga hoy y cuánto en el local.
 */
export interface ServicioPublicoDto {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly precio: number;
  readonly moneda: "COP";
  readonly duracionMinutos: number;
  readonly anticipo: number;
  readonly saldo: number;
}

export function aServicioDto(servicio: Servicio): ServicioDto {
  const datos = servicio.instantanea();
  return {
    id: datos.id,
    idBarberia: datos.idBarberia,
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    precio: datos.precio,
    moneda: "COP",
    duracionMinutos: datos.duracionMinutos,
    anticipo: servicio.anticipoExigido().valorEnPesos,
    saldo: servicio.saldoPresencial().valorEnPesos,
    estado: datos.estado,
    puedeReservarse: servicio.puedeReservarse(),
    creadoEn: datos.creadoEn.toISOString(),
    actualizadoEn: datos.actualizadoEn.toISOString(),
  };
}

export function aServicioPublicoDto(servicio: Servicio): ServicioPublicoDto {
  const datos = servicio.instantanea();
  return {
    id: datos.id,
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    precio: datos.precio,
    moneda: "COP",
    duracionMinutos: datos.duracionMinutos,
    anticipo: servicio.anticipoExigido().valorEnPesos,
    saldo: servicio.saldoPresencial().valorEnPesos,
  };
}
