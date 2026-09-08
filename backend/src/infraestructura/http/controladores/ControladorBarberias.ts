import type { Request, Response } from "express";
import { ActualizarPerfilBarberia } from "../../../aplicacion/casos-uso/barberia/ActualizarPerfilBarberia";
import { HabilitarBarberia } from "../../../aplicacion/casos-uso/barberia/HabilitarBarberia";
import { ListarBarberiasHabilitadas } from "../../../aplicacion/casos-uso/barberia/ListarBarberiasHabilitadas";
import { ListarBarberiasPorEstado } from "../../../aplicacion/casos-uso/barberia/ListarBarberiasPorEstado";
import { ObtenerBarberia } from "../../../aplicacion/casos-uso/barberia/ObtenerBarberia";
import { RegistrarBarberia } from "../../../aplicacion/casos-uso/barberia/RegistrarBarberia";
import { SuspenderBarberia } from "../../../aplicacion/casos-uso/barberia/SuspenderBarberia";

export interface CasosDeUsoBarberia {
  readonly registrar: RegistrarBarberia;
  readonly habilitar: HabilitarBarberia;
  readonly suspender: SuspenderBarberia;
  readonly actualizarPerfil: ActualizarPerfilBarberia;
  readonly obtener: ObtenerBarberia;
  readonly listarHabilitadas: ListarBarberiasHabilitadas;
  readonly listarPorEstado: ListarBarberiasPorEstado;
}

/** Lee un campo del cuerpo como texto, sin confiar en lo que llega por la red. */
function texto(cuerpo: unknown, campo: string): string {
  const valor = (cuerpo as Record<string, unknown> | null | undefined)?.[campo];
  return typeof valor === "string" ? valor : "";
}

function textoDeConsulta(valor: unknown): string | undefined {
  return typeof valor === "string" && valor.trim().length > 0 ? valor : undefined;
}

/**
 * Adaptador de entrada. Traduce HTTP a comandos y comandos a HTTP.
 * No contiene ni una regla de negocio: cada campo se arma explícitamente para
 * que el cuerpo de la petición no pueda inyectar propiedades no previstas.
 */
export class ControladorBarberias {
  constructor(private readonly casos: CasosDeUsoBarberia) {}

  registrar = async (peticion: Request, respuesta: Response): Promise<void> => {
    const dto = await this.casos.registrar.ejecutar({
      nombre: texto(peticion.body, "nombre"),
      descripcion: texto(peticion.body, "descripcion"),
      direccion: texto(peticion.body, "direccion"),
      ciudad: texto(peticion.body, "ciudad"),
      telefono: texto(peticion.body, "telefono"),
      correo: texto(peticion.body, "correo"),
    });
    respuesta.status(201).json(dto);
  };

  obtener = async (peticion: Request, respuesta: Response): Promise<void> => {
    const dto = await this.casos.obtener.ejecutar({ idBarberia: String(peticion.params.id) });
    respuesta.status(200).json(dto);
  };

  actualizarPerfil = async (peticion: Request, respuesta: Response): Promise<void> => {
    const dto = await this.casos.actualizarPerfil.ejecutar({
      idBarberia: String(peticion.params.id),
      // Con autenticación real (CAR-17) esto saldrá del token, no del cuerpo.
      idBarberiaDelSolicitante: texto(peticion.body, "idBarberiaDelSolicitante"),
      nombre: texto(peticion.body, "nombre"),
      descripcion: texto(peticion.body, "descripcion"),
      direccion: texto(peticion.body, "direccion"),
      ciudad: texto(peticion.body, "ciudad"),
      telefono: texto(peticion.body, "telefono"),
    });
    respuesta.status(200).json(dto);
  };

  habilitar = async (peticion: Request, respuesta: Response): Promise<void> => {
    const dto = await this.casos.habilitar.ejecutar({
      idBarberia: String(peticion.params.id),
      idOperador: texto(peticion.body, "idOperador"),
    });
    respuesta.status(200).json(dto);
  };

  suspender = async (peticion: Request, respuesta: Response): Promise<void> => {
    const dto = await this.casos.suspender.ejecutar({
      idBarberia: String(peticion.params.id),
      idOperador: texto(peticion.body, "idOperador"),
      motivo: texto(peticion.body, "motivo"),
    });
    respuesta.status(200).json(dto);
  };

  listarPublicas = async (peticion: Request, respuesta: Response): Promise<void> => {
    const dtos = await this.casos.listarHabilitadas.ejecutar({
      ciudad: textoDeConsulta(peticion.query.ciudad),
      texto: textoDeConsulta(peticion.query.texto),
    });
    respuesta.status(200).json(dtos);
  };

  listarPorEstado = async (peticion: Request, respuesta: Response): Promise<void> => {
    const estado = textoDeConsulta(peticion.query.estado) ?? "PENDIENTE_VERIFICACION";
    const dtos = await this.casos.listarPorEstado.ejecutar({ estado });
    respuesta.status(200).json(dtos);
  };
}
