import express, { Express, Router } from "express";
import { manejadorDeErrores } from "./middlewares/manejadorDeErrores";

export function crearServidor(rutas: Router): Express {
  const app = express();
  app.use(express.json());

  app.get("/salud", (_peticion, respuesta) => {
    respuesta.json({ estado: "ok" });
  });

  app.use("/api", rutas);
  app.use(manejadorDeErrores);
  return app;
}
