import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest'
import { RegistrarAusencia } from '../../src/aplicacion/casos-uso/RegistrarAusencia'
import type { AusenciaDAO } from '../../src/dominio/puertos/AusenciaDAO'

describe('Caso de Uso: Registrar Ausencia', () => {
  let mockAusenciaDAO: Mocked<AusenciaDAO>
  let registrarAusencia: RegistrarAusencia

  beforeEach(() => {
    // Simulamos la base de datos con Vitest
    mockAusenciaDAO = {
      guardar: vi.fn(),
      actualizar: vi.fn(),
      eliminar: vi.fn(),
      buscarPorId: vi.fn()
    }
    registrarAusencia = new RegistrarAusencia(mockAusenciaDAO)
  })

  it('debe lanzar error si el usuario no es ADMINISTRADOR', async () => {
    const peticion = {
      barberoId: 'barbero-123',
      tipo: 'DIA_LIBRE',
      desde: new Date('2026-11-01T08:00:00Z'),
      hasta: new Date('2026-11-01T18:00:00Z'),
      rolUsuarioActual: 'BARBERO' // Rol incorrecto
    }

    await expect(registrarAusencia.ejecutar(peticion)).rejects.toThrow('No autorizado: Solo los administradores pueden registrar ausencias.')
    expect(mockAusenciaDAO.guardar).not.toHaveBeenCalled()
  })

  it('debe guardar la ausencia si el usuario es ADMINISTRADOR y los datos son válidos', async () => {
    const peticion = {
      barberoId: 'barbero-123',
      tipo: 'DIA_LIBRE',
      desde: new Date('2026-11-01T08:00:00Z'),
      hasta: new Date('2026-11-01T18:00:00Z'),
      rolUsuarioActual: 'ADMINISTRADOR' // Rol correcto
    }

    mockAusenciaDAO.guardar.mockResolvedValueOnce({
      id: 'ausencia-123',
      ...peticion,
      tipo: 'DIA_LIBRE'
    })

    const resultado = await registrarAusencia.ejecutar(peticion)

    expect(mockAusenciaDAO.guardar).toHaveBeenCalledTimes(1)
    expect(resultado.id).toBe('ausencia-123')
  })
})