/**
 * Raíz de composición: el ÚNICO archivo autorizado a hacer `new` de clases de
 * infraestructura y a importarlo todo. Cambiar de motor de base de datos o el
 * reloj del sistema se hace aquí, sin tocar dominio ni aplicación.
 */
import { ActualizarPerfilBarberia } from "./aplicacion/casos-uso/barberia/ActualizarPerfilBarberia";
import { HabilitarBarberia } from "./aplicacion/casos-uso/barberia/HabilitarBarberia";
import { ListarBarberiasHabilitadas } from "./aplicacion/casos-uso/barberia/ListarBarberiasHabilitadas";
import { ListarBarberiasPorEstado } from "./aplicacion/casos-uso/barberia/ListarBarberiasPorEstado";
import { ObtenerBarberia } from "./aplicacion/casos-uso/barberia/ObtenerBarberia";
import { RegistrarBarberia } from "./aplicacion/casos-uso/barberia/RegistrarBarberia";
import { SuspenderBarberia } from "./aplicacion/casos-uso/barberia/SuspenderBarberia";
import { ActivarServicio } from "./aplicacion/casos-uso/catalogo/ActivarServicio";
import { ActualizarServicio } from "./aplicacion/casos-uso/catalogo/ActualizarServicio";
import { CrearServicio } from "./aplicacion/casos-uso/catalogo/CrearServicio";
import { DesactivarServicio } from "./aplicacion/casos-uso/catalogo/DesactivarServicio";
import { ListarCatalogoDeBarberia } from "./aplicacion/casos-uso/catalogo/ListarCatalogoDeBarberia";
import { ListarCatalogoPublico } from "./aplicacion/casos-uso/catalogo/ListarCatalogoPublico";
import { ObtenerServicio } from "./aplicacion/casos-uso/catalogo/ObtenerServicio";
import { cargarEntorno } from "./infraestructura/configuracion/cargarEntorno";
import { ControladorBarberias } from "./infraestructura/http/controladores/ControladorBarberias";
import { ControladorServicios } from "./infraestructura/http/controladores/ControladorServicios";
import { rutasDeBarberias } from "./infraestructura/http/rutas/barberias";
import { rutasDeServicios } from "./infraestructura/http/rutas/servicios";
import { crearServidor } from "./infraestructura/http/servidor";
import { GeneradorIdUuid } from "./infraestructura/identificadores/GeneradorIdUuid";
import { abrirConexion, configuracionDesdeEntorno } from "./infraestructura/persistencia/conexion";
import { aplicarEsquema } from "./infraestructura/persistencia/migraciones/aplicarEsquema";
import { RepositorioBarberiasSQLServer } from "./infraestructura/persistencia/repositorios/RepositorioBarberiasSQLServer";
import { RepositorioServiciosSQLServer } from "./infraestructura/persistencia/repositorios/RepositorioServiciosSQLServer";
import { RelojSistema } from "./infraestructura/tiempo/RelojSistema";

async function iniciar(): Promise<void> {
  // Lo primero: las variables del archivo .env deben existir antes de que
  // alguien lea process.env. No pisa lo que ya venga del sistema o del CI.
  cargarEntorno();

  const puerto = Number(process.env.PUERTO ?? 3000);

  // Adaptadores
  const pool = await abrirConexion(configuracionDesdeEntorno());
  await aplicarEsquema(pool);

  const repositorioBarberias = new RepositorioBarberiasSQLServer(pool);
  const repositorioServicios = new RepositorioServiciosSQLServer(pool);
  const reloj = new RelojSistema();
  const generadorId = new GeneradorIdUuid();

  // Casos de uso
  const controladorBarberias = new ControladorBarberias({
    registrar: new RegistrarBarberia(repositorioBarberias, generadorId, reloj),
    habilitar: new HabilitarBarberia(repositorioBarberias, reloj),
    suspender: new SuspenderBarberia(repositorioBarberias, reloj),
    actualizarPerfil: new ActualizarPerfilBarberia(repositorioBarberias, reloj),
    obtener: new ObtenerBarberia(repositorioBarberias),
    listarHabilitadas: new ListarBarberiasHabilitadas(repositorioBarberias),
    listarPorEstado: new ListarBarberiasPorEstado(repositorioBarberias),
  });

  const controladorServicios = new ControladorServicios({
    crear: new CrearServicio(repositorioServicios, repositorioBarberias, generadorId, reloj),
    actualizar: new ActualizarServicio(repositorioServicios, reloj),
    activar: new ActivarServicio(repositorioServicios, reloj),
    desactivar: new DesactivarServicio(repositorioServicios, reloj),
    obtener: new ObtenerServicio(repositorioServicios),
    listarCatalogo: new ListarCatalogoDeBarberia(repositorioServicios),
    listarPublicos: new ListarCatalogoPublico(repositorioServicios, repositorioBarberias),
  });

  const servidor = crearServidor(
    rutasDeBarberias(controladorBarberias),
    rutasDeServicios(controladorServicios),
  ).listen(puerto, () => {
    console.log(`KronoBarber escuchando en http://localhost:${puerto}`);
  });

  const cerrar = async (): Promise<void> => {
    servidor.close();
    await pool.close();
    process.exit(0);
  };
  process.on("SIGINT", cerrar);
  process.on("SIGTERM", cerrar);
}

iniciar().catch((error) => {
  console.error("No fue posible iniciar KronoBarber:", error);
  process.exit(1);
});
