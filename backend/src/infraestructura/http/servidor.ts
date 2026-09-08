import express, { Express, Router } from "express";
import { manejadorDeErrores } from "./middlewares/manejadorDeErrores";

/**
 * Arma la aplicación Express. Recibe las rutas ya construidas en lugar de
 * crearlas: así el servidor no conoce ningún caso de uso y se puede levantar
 * en una prueba con rutas de mentira.
 *
 * **El orden de los `use` importa y no es arbitrario:**
 *  1. `express.json()` primero, o el cuerpo de las peticiones llega vacío.
 *  2. `/salud` fuera de `/api` porque no es parte del negocio: lo consulta el
 *     despliegue para saber si el proceso está vivo, sin tocar la base de datos.
 *  3. Las rutas del negocio, todas bajo el prefijo `/api`.
 *  4. `manejadorDeErrores` **al final**. Express reconoce un manejador de
 *     errores por sus cuatro parámetros y solo le pasa lo que reventó antes;
 *     si se registra arriba, nunca se entera de nada.
 *
 * Recibe **un router por entidad** (barberías, servicios, y los que vengan) y
 * los monta en el orden en que llegan. Express prueba las rutas en ese orden,
 * así que dos entidades no deben declarar el mismo patrón de URL.
 */
export function crearServidor(...rutas: readonly Router[]): Express {
  const app = express();
  app.use(express.json());

  app.get("/salud", (_peticion, respuesta) => {
    respuesta.json({ estado: "ok" });
  });

  for (const router of rutas) {
    app.use("/api", router);
  }

  app.use(manejadorDeErrores);
  return app;
}
