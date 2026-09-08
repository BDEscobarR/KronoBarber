import { Router } from "express";
import { ControladorServicios } from "../controladores/ControladorServicios";
import { capturarErrores } from "../middlewares/capturarErrores";

/**
 * Mapa de URL a caso de uso para el catálogo (CAR-03, CAR-07). Aquí no hay
 * lógica: solo se decide qué método y qué ruta corresponden a cada operación.
 *
 * **Por qué los servicios cuelgan de una barbería en la URL**
 * (`/barberias/:idBarberia/servicios`): un servicio no existe por sí solo, y
 * tener la barbería en la ruta hace que el aislamiento multiempresa (RES-02)
 * sea visible en el propio contrato de la API.
 *
 * Las operaciones sobre un servicio concreto sí cuelgan de `/servicios/:id`
 * porque su identificador ya es único en toda la plataforma; la barbería dueña
 * se comprueba contra el agregado, no contra la URL.
 *
 * **No hay `DELETE`, y es deliberado.** Un servicio se desactiva y nunca se
 * borra, porque los turnos pasados apuntan a él (CAR-03, NC-07). Activar y
 * desactivar son `POST` a un sub-recurso, igual que la habilitación de una
 * barbería: son acciones con efecto propio, no una edición de la ficha.
 *
 * Falta la guarda por rol (CAR-17): hoy el solicitante se declara en el cuerpo
 * o en la consulta. Entra con el caso de uso de identidad.
 */
export function rutasDeServicios(controlador: ControladorServicios): Router {
  const router = Router();

  // Público (cliente): solo servicios activos de una barbería habilitada (CAR-07, RES-11)
  router.get("/barberias/:idBarberia/catalogo", capturarErrores(controlador.listarPublicos));

  // Administrador de barbería (CAR-03)
  router.get("/barberias/:idBarberia/servicios", capturarErrores(controlador.listarCatalogo));
  router.post("/barberias/:idBarberia/servicios", capturarErrores(controlador.crear));
  router.get("/servicios/:id", capturarErrores(controlador.obtener));
  router.put("/servicios/:id", capturarErrores(controlador.actualizar));
  router.post("/servicios/:id/activacion", capturarErrores(controlador.activar));
  router.post("/servicios/:id/desactivacion", capturarErrores(controlador.desactivar));

  return router;
}
