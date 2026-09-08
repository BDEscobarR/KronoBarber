import { Router } from "express";
import { ControladorBarberias } from "../controladores/ControladorBarberias";
import { capturarErrores } from "../middlewares/capturarErrores";

/**
 * Mapa de URL a caso de uso.
 *
 * Las rutas del operador viven bajo /operador porque su alcance es
 * transversal; las del administrador cuelgan de la barbería concreta.
 * Falta la guarda por rol (CAR-17): entra con el caso de uso de identidad.
 */
export function rutasDeBarberias(controlador: ControladorBarberias): Router {
  const router = Router();

  // Público (cliente): solo barberías habilitadas (CAR-07, RES-11)
  router.get("/barberias", capturarErrores(controlador.listarPublicas));

  // Administrador de barbería (CAR-01)
  router.post("/barberias", capturarErrores(controlador.registrar));
  router.get("/barberias/:id", capturarErrores(controlador.obtener));
  router.put("/barberias/:id", capturarErrores(controlador.actualizarPerfil));

  // Operador de la plataforma (CAR-02, CAR-19)
  router.get("/operador/barberias", capturarErrores(controlador.listarPorEstado));
  router.post("/operador/barberias/:id/habilitacion", capturarErrores(controlador.habilitar));
  router.post("/operador/barberias/:id/suspension", capturarErrores(controlador.suspender));

  return router;
}
