// src/dominio/modelo/Usuario.ts

export const ROLES_USUARIO = ['OPERADOR', 'ADMINISTRADOR', 'BARBERO', 'CLIENTE'] as const;
export type RolUsuario = (typeof ROLES_USUARIO)[number];

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  claveHash: string;
  rol: RolUsuario;
  barberiaId: string | null; // nulo explícito para OPERADOR o CLIENTE
  creadoEn: Date;
}

export type UsuarioNuevo = Omit<Usuario, 'id' | 'creadoEn'>;

export interface UsuarioDTO {
  id: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  barberiaId: string | null;
}

export function esRolUsuario(valor: unknown): valor is RolUsuario {
  return typeof valor === 'string' && (ROLES_USUARIO as readonly string[]).includes(valor);
}

export function aUsuarioDTO(usuario: Usuario): UsuarioDTO {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    barberiaId: usuario.barberiaId,
  };
}