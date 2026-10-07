import { minutosDesdeMedianoche, seSolapan, type FranjaAtencion, type HorarioAtencion } from '../../dominio/modelo/HorarioAtencion'
import type { BarberiaDAO, HorarioAtencionDAO } from '../../dominio/puertos'
import { BarberiaNoEncontrada } from './HabilitarBarberia'

export type ConfiguracionHorarioDTO = Omit<HorarioAtencion, 'barberiaId'>

/** Valida estructura, horas, cierres y ausencia de solapamientos antes de persistir. */
export function validarConfiguracionHorario(cuerpo: unknown): ConfiguracionHorarioDTO | string {
  const d = (cuerpo ?? {}) as Record<string, unknown>
  if (!Array.isArray(d['franjas'])) return 'franjas debe ser una lista'
  if (!Array.isArray(d['cierres']) || !d['cierres'].every((fecha) => typeof fecha === 'string' && fechaValida(fecha)))
    return 'cierres debe contener fechas válidas en formato YYYY-MM-DD'

  const franjas: FranjaAtencion[] = []
  for (const valor of d['franjas']) {
    if (!valor || typeof valor !== 'object') return 'franja inválida'
    const franja = valor as Record<string, unknown>
    const inicio = typeof franja['horaInicio'] === 'string' ? minutosDesdeMedianoche(franja['horaInicio']) : null
    const fin = typeof franja['horaFin'] === 'string' ? minutosDesdeMedianoche(franja['horaFin']) : null
    if (!Number.isInteger(franja['diaSemana']) || Number(franja['diaSemana']) < 0 || Number(franja['diaSemana']) > 6)
      return 'diaSemana debe ser un entero entre 0 y 6'
    if (inicio === null || fin === null) return 'horaInicio y horaFin deben tener formato HH:mm válido'
    if (inicio >= fin) return 'horaInicio debe ser anterior a horaFin'
    const nueva: FranjaAtencion = {
      diaSemana: Number(franja['diaSemana']),
      horaInicio: franja['horaInicio'] as string,
      horaFin: franja['horaFin'] as string,
    }
    if (franjas.some((existente) => seSolapan(existente, nueva))) return 'Las franjas del mismo día no pueden solaparse'
    franjas.push(nueva)
  }

  const cierres = d['cierres'] as string[]
  if (new Set(cierres).size !== cierres.length) return 'cierres no puede contener fechas repetidas'
  return { franjas, cierres }
}

function fechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false
  const anio = Number(fecha.slice(0, 4))
  const mes = Number(fecha.slice(5, 7))
  const dia = Number(fecha.slice(8, 10))
  const fechaUtc = new Date(Date.UTC(anio, mes - 1, dia))
  return fechaUtc.getUTCFullYear() === anio && fechaUtc.getUTCMonth() === mes - 1 && fechaUtc.getUTCDate() === dia
}

/** Configura o reemplaza las franjas recurrentes y los cierres por fecha de una barbería. */
export class ConfigurarHorarioAtencion {
  constructor(
    private readonly barberias: BarberiaDAO,
    private readonly horarios: HorarioAtencionDAO,
  ) {}

  async ejecutar(barberiaId: string, configuracion: ConfiguracionHorarioDTO): Promise<HorarioAtencion> {
    if (!(await this.barberias.porId(barberiaId))) throw new BarberiaNoEncontrada(barberiaId)
    return this.horarios.reemplazar({ barberiaId, ...configuracion })
  }
}
