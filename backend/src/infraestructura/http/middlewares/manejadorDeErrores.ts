import type { NextFunction, Request, Response } from "express";
import {
  AccesoNoAutorizado,
  BarberiaNoEncontrada,
  CorreoDeBarberiaYaRegistrado,
  NombreDeServicioYaRegistrado,
  ServicioNoEncontrado,
} from "../../../aplicacion/errores/ErrorAplicacion";
import { ErrorDeTransicion, ErrorDeValidacion } from "../../../dominio/errores/ErrorDominio";

/**
 * Única traducción de error de dominio a código HTTP. El dominio no sabe que
 * existe el 409; la infraestructura sí.
 *
 * No se registran ni el cuerpo de la petición ni datos personales: solo el
 * tipo de error (atributo de seguridad, README §10).
 */
export function manejadorDeErrores(
  error: Error,
  _peticion: Request,
  respuesta: Response,
  _siguiente: NextFunction,
): void {
  if (error instanceof ErrorDeValidacion) {
    respuesta.status(400).json({ error: error.name, mensaje: error.message });
    return;
  }
  if (error instanceof AccesoNoAutorizado) {
    respuesta.status(403).json({ error: error.name, mensaje: error.message });
    return;
  }
  if (error instanceof BarberiaNoEncontrada || error instanceof ServicioNoEncontrado) {
    respuesta.status(404).json({ error: error.name, mensaje: error.message });
    return;
  }
  if (
    error instanceof ErrorDeTransicion ||
    error instanceof CorreoDeBarberiaYaRegistrado ||
    error instanceof NombreDeServicioYaRegistrado
  ) {
    respuesta.status(409).json({ error: error.name, mensaje: error.message });
    return;
  }

  console.error("Error no previsto:", error.name);
  respuesta.status(500).json({ error: "ErrorInterno", mensaje: "Ocurrió un error inesperado." });
}
