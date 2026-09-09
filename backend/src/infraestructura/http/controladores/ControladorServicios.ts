import type { Request, Response } from "express";
import { ActivarServicio } from "../../../aplicacion/casos-uso/catalogo/ActivarServicio";
import { ActualizarServicio } from "../../../aplicacion/casos-uso/catalogo/ActualizarServicio";
import { CrearServicio } from "../../../aplicacion/casos-uso/catalogo/CrearServicio";
import { DesactivarServicio } from "../../../aplicacion/casos-uso/catalogo/DesactivarServicio";
import { ListarCatalogoDeBarberia } from "../../../aplicacion/casos-uso/catalogo/ListarCatalogoDeBarberia";
import { ListarCatalogoPublico } from "../../../aplicacion/casos-uso/catalogo/ListarCatalogoPublico";
import { ObtenerServicio } from "../../../aplicacion/casos-uso/catalogo/ObtenerServicio";

export interface CasosDeUsoServicio {
  readonly crear: CrearServicio;
  readonly actualizar: ActualizarServicio;
  readonly activar: ActivarServicio;
  readonly desactivar: DesactivarServicio;
  readonly obtener: ObtenerServicio;
  readonly listarCatalogo: ListarCatalogoDeBarberia;
  readonly listarPublicos: ListarCatalogoPublico;
}

/** Lee un campo del cuerpo como texto, sin confiar en lo que llega por la red. */
function texto(cuerpo: unknown, campo: string): string {
  const valor = (cuerpo as Record<string, unknown> | null | undefined)?.[campo];
  return typeof valor === "string" ? valor : "";
}

/**
 * Lee un campo del cuerpo como número.
 *
 * Devuelve `NaN` cuando el campo falta o no es numérico, y **no** lanza aquí:
 * quien decide que un precio o una duración no valen es el objeto de valor del
 * dominio, que además da el mensaje en español. Este archivo solo traduce.
 *
 * Se aceptan `12000` y `"12000"` porque un formulario HTML envía texto, pero
 * no `"12.000 pesos"`: `Number("12.000 pesos")` ya es `NaN`.
 */
function numero(cuerpo: unknown, campo: string): number {
  const valor = (cuerpo as Record<string, unknown> | null | undefined)?.[campo];
  if (typeof valor === "number") {
    return valor;
  }
  if (typeof valor === "string" && valor.trim().length > 0) {
    return Number(valor);
  }
  return Number.NaN;
}

function textoDeConsulta(valor: unknown): string | undefined {
  return typeof valor === "string" && valor.trim().length > 0 ? valor : undefined;
}

/**
 * Adaptador de entrada del catálogo. Traduce HTTP a comandos y comandos a HTTP.
 * No contiene ni una regla de negocio: cada campo se arma explícitamente para
 * que el cuerpo de la petición no pueda inyectar propiedades no previstas.
 *
 * `idBarberiaDelSolicitante` sale hoy del cuerpo, igual que en barberías.
 * Con autenticación real (CAR-17) saldrá del token y dejará de ser un dato que
 * el cliente elige.
 */
export class ControladorServicios {
  constructor(private readonly casos: CasosDeUsoServicio) {}

  crear = async (peticion: Request, respuesta: Response): Promise<void> => {
    const dto = await this.casos.crear.ejecutar({
      idBarberia: String(peticion.params.idBarberia),
      idBarberiaDelSolicitante: texto(peticion.body, "idBarberiaDelSolicitante"),
      nombre: texto(peticion.body, "nombre"),
      descripcion: texto(peticion.body, "descripcion"),
      precio: numero(peticion.body, "precio"),
      duracionMinutos: numero(peticion.body, "duracionMinutos"),
    });
    respuesta.status(201).json(dto);
  };

  listarCatalogo = async (peticion: Request, respuesta: Response): Promise<void> => {
    const dtos = await this.casos.listarCatalogo.ejecutar({
      idBarberia: String(peticion.params.idBarberia),
      idBarberiaDelSolicitante: textoDeConsulta(peticion.query.idBarberiaDelSolicitante) ?? "",
      estado: textoDeConsulta(peticion.query.estado),
      texto: textoDeConsulta(peticion.query.texto),
    });
    respuesta.status(200).json(dtos);
  };

  listarPublicos = async (peticion: Request, respuesta: Response): Promise<void> => {
    const dtos = await this.casos.listarPublicos.ejecutar({
      idBarberia: String(peticion.params.idBarberia),
    });
    respuesta.status(200).json(dtos);
  };

  obtener = async (peticion: Request, respuesta: Response): Promise<void> => {
    const dto = await this.casos.obtener.ejecutar({
      idServicio: String(peticion.params.id),
      idBarberiaDelSolicitante: textoDeConsulta(peticion.query.idBarberiaDelSolicitante) ?? "",
    });
    respuesta.status(200).json(dto);
  };

  actualizar = async (peticion: Request, respuesta: Response): Promise<void> => {
    const dto = await this.casos.actualizar.ejecutar({
      idServicio: String(peticion.params.id),
      idBarberiaDelSolicitante: texto(peticion.body, "idBarberiaDelSolicitante"),
      nombre: texto(peticion.body, "nombre"),
      descripcion: texto(peticion.body, "descripcion"),
      precio: numero(peticion.body, "precio"),
      duracionMinutos: numero(peticion.body, "duracionMinutos"),
    });
    respuesta.status(200).json(dto);
  };

  activar = async (peticion: Request, respuesta: Response): Promise<void> => {
    const dto = await this.casos.activar.ejecutar({
      idServicio: String(peticion.params.id),
      idBarberiaDelSolicitante: texto(peticion.body, "idBarberiaDelSolicitante"),
    });
    respuesta.status(200).json(dto);
  };

  desactivar = async (peticion: Request, respuesta: Response): Promise<void> => {
    const dto = await this.casos.desactivar.ejecutar({
      idServicio: String(peticion.params.id),
      idBarberiaDelSolicitante: texto(peticion.body, "idBarberiaDelSolicitante"),
    });
    respuesta.status(200).json(dto);
  };
}
