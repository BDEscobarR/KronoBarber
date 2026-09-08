import type { Request, RequestHandler, Response } from "express";

/**
 * Envuelve un manejador asíncrono para que sus rechazos lleguen al manejador
 * de errores de Express en lugar de quedar en una promesa sin capturar.
 */
export function capturarErrores(
  manejador: (peticion: Request, respuesta: Response) => Promise<void>,
): RequestHandler {
  return (peticion, respuesta, siguiente) => {
    manejador(peticion, respuesta).catch(siguiente);
  };
}
