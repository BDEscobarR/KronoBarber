# KronoBarber

Plataforma web **multiempresa** de gestión y reserva de turnos para barberías.
Proyecto de Ingeniería de Software II (103093) · Universidad Autónoma de Manizales · Semestre 2026-03.

> Este README es el documento de contexto del repositorio. Resume el **qué** (Documento de Visión v1.1)
> y fija el **cómo** (arquitectura y convenciones). Ante una duda de alcance, manda el Documento de Visión;
> ante una duda de estructura, manda este archivo.

---

## 1. La idea en una frase

Una sola instancia del sistema atiende a **varias barberías independientes**. Cada barbería administra su
información de negocio, su catálogo de servicios, su personal y sus horarios; los clientes entran a un
espacio común, eligen **barbería → servicio → barbero → espacio libre**, y confirman la cita pagando en
línea un **anticipo del 20 %** del valor del servicio. El 80 % restante se paga presencialmente y **fuera
del sistema**.

### Sentencia de posición

**Para** los propietarios y administradores de barberías urbanas que hoy gestionan sus turnos por
mensajería, llamada o cuaderno, **que** necesitan reducir las inasistencias y aprovechar la capacidad de
cada barbero sin dedicar el día a coordinar citas, **KronoBarber** es una plataforma web compartida de
gestión y reserva de turnos **que** centraliza catálogo, personal, horarios y permisos, publica la
disponibilidad real de cada barbero y confirma cada cita con un anticipo del 20 %.
**A diferencia de** la agenda por mensajería y de las agendas genéricas de citas, **nuestro producto**
modela la disponibilidad **por profesional** y no por local, y convierte cada reserva en un compromiso
económico verificable.

### Los tres problemas que ataca

| Id | Problema | Solución esperada |
|---|---|---|
| **P-01** | Turnos acordados informalmente a los que el cliente no se presenta, sin costo para él | Reserva confirmada con anticipo del 20 %, y liberación automática del espacio si la reserva no se completa |
| **P-02** | No se puede saber, sin llamar ni escribir, cuándo está libre un barbero concreto | Calendario en línea con los espacios realmente libres, reservables en el acto |
| **P-03** | Servicios, precios, personal, horarios y ausencias en registros dispersos | Administración centralizada donde aprobar un permiso cambia de inmediato la disponibilidad publicada |

---

## 2. Actores y roles

| Rol | Qué hace | Alcance de lo que ve |
|---|---|---|
| **Operador de la plataforma** | Verifica y **habilita** barberías, **suspende** las que incumplen políticas, supervisa la operación | Transversal: no pertenece a ninguna barbería |
| **Administrador de barbería** | Perfil del negocio, catálogo de servicios, personal, horarios de atención, aprobación de ausencias, agenda general | **Solo su propia barbería** |
| **Barbero** | Consulta su agenda, gestiona su jornada y bloqueos, solicita ausencias, registra la observación de cierre | **Solo su propia agenda** |
| **Cliente** | Explora barberías, elige servicio y barbero, reserva pagando el anticipo, cancela o reprograma | Barberías **habilitadas** y sus propios turnos |

---

## 3. Vocabulario del dominio (obligatorio en el código)

El código se escribe **en español** con estos nombres exactos. Si un concepto no está aquí, probablemente
no exista todavía en el dominio.

| Término | Significado preciso |
|---|---|
| **Barbería** | Establecimiento de **una sola sede**. Es la unidad de aislamiento de los datos (tenant). |
| **Servicio** | Prestación con nombre, precio y **duración estimada**. La duración determina el tamaño del turno. |
| **Catálogo** | Servicios vigentes de una barbería. Un servicio se **desactiva**, nunca se borra. |
| **Turno** | Intervalo comprometido entre un cliente y un barbero para un servicio. Unidad central del sistema. |
| **Reserva** | Acto de solicitar un turno. **Solo se considera confirmada cuando se pagó el anticipo.** |
| **Anticipo** | 20 % del valor del servicio, pagado en línea. Convierte la cita en compromiso económico. |
| **Saldo** | 80 % restante. Se paga presencialmente y **no pasa por la plataforma**. |
| **Horario de atención** | Días y franjas en que abre la barbería. Límite exterior de toda disponibilidad. |
| **Jornada** | Franja propia del barbero **dentro** del horario del establecimiento. |
| **Ausencia** | Permiso, día libre o bloqueo puntual **aprobado**. Retira disponibilidad de inmediato. |
| **Disponibilidad** | Horario de atención ∩ jornada − ausencias aprobadas − turnos ya reservados. |
| **Espacio libre** | Intervalo continuo de la disponibilidad, **de duración suficiente para el servicio elegido**. Es lo único que el cliente ve. |
| **Solapamiento** | Coincidencia total o parcial de dos turnos del mismo barbero. El sistema debe impedirlo incluso ante reservas concurrentes. |
| **Reprogramación** | Traslado de un turno confirmado a otro espacio libre, conservando el anticipo según la política. |
| **Cancelación** | Terminación anticipada, con el tratamiento del anticipo que fije la política **comunicada antes del pago**. |
| **Inasistencia** | Turno confirmado al que el cliente no se presenta. Es un **estado del ciclo de vida**, no un incidente suelto. |
| **Agenda** | Vista de turnos en el tiempo: **general** (todo el establecimiento) o **personal** (un barbero). |
| **Observación de cierre** | Nota estructurada del barbero al finalizar la atención; se incorpora al historial del cliente. |
| **Habilitación / Suspensión** | Autorización (o su retiro) del operador para que una barbería reciba reservas. |
| **Pasarela de pagos** | Servicio externo que procesa el anticipo. La plataforma **no** almacena medios de pago. |
| **Sandbox** | Modo de la pasarela que reproduce el flujo completo sin dinero real. |

**Prefijos de identificador del Documento de Visión** (referenciarlos, no repetir su enunciado):
`P-` problemas · `NC-` necesidades clave · `SUP-` suposiciones · `DEP-` dependencias ·
`CAR-` características · `RES-` restricciones.

---

## 4. Reglas de negocio que no se negocian

Estas son las invariantes del dominio. Cada una debería tener una prueba unitaria con su nombre.

1. **El anticipo es del 20 % exacto**, sin excepciones configurables por barbería en esta versión (RES-03).
2. **La reserva no está confirmada hasta que el anticipo se pagó.** Antes de eso el espacio no está
   comprometido de forma definitiva (CAR-10). Una reserva sin pagar **libera el espacio** al vencer su plazo.
3. **El saldo del 80 % no se procesa en la plataforma** (RES-04, SUP-04). No hay caja, ni conciliación,
   ni devoluciones automáticas.
4. **La disponibilidad de un barbero nunca excede el horario de atención de su barbería** (RES-07).
5. **Nunca dos turnos solapados del mismo barbero**, ni siquiera ante intentos simultáneos (CAR-13).
   Esto es una regla de concurrencia, no solo una validación de formulario.
6. **Una barbería no habilitada no es visible ni recibe reservas** (RES-11, CAR-02).
7. **Una barbería = una sede** (SUP-03). No cerrar el diseño contra esta suposición, pero no implementar cadenas.
8. **La política de cancelación y el precio total se muestran al cliente antes de pagar** (RES-14, Ley 1480 de 2011).
9. **No se almacenan datos de tarjeta ni credenciales de pago**; solo la referencia de la transacción (RES-13).
10. **COP, español, zona horaria America/Bogotá** para toda la operación (RES-06, DEP-02).
11. **Aislamiento lógico multiempresa**: cada administrador ve únicamente su negocio (RES-02).
12. **Ley 1581 de 2012 y Decreto 1074 de 2015**: autorización previa e informada, finalidad declarada,
    atención de consultas y reclamos (RES-12).

### Ciclo de vida del turno

```
                        (pago del anticipo)
  RESERVADO ──────────────────────────────────▶ CONFIRMADO
      │                                          │  │  │
      │ (vence el plazo de pago)                 │  │  └──▶ ATENDIDO   (cierre + observación)
      └──▶ CANCELADO ◀───────────────────────────┘  └─────▶ INASISTIDO (el cliente no llegó)
                    (cancelación cliente/barbería)
```

Las transiciones inválidas **no existen**: no se cierra un turno cancelado, no se atiende uno que nunca se
confirmó. Esto se modela con estados explícitos (patrón **State**), no con un `if` sobre un string.

---

## 5. Características del producto (CAR-01 … CAR-19)

Alto nivel, verificables a nivel de negocio. Cada una se desarrolla como una o varias historias de usuario.

| Id | Característica | Perfil |
|---|---|---|
| CAR-01 | Registro y perfil de barbería | Administrador |
| CAR-02 | Habilitación y suspensión de barberías | Operador |
| CAR-03 | Catálogo de servicios (precio, duración, activar/desactivar) | Administrador |
| CAR-04 | Gestión del personal y de los servicios que presta cada barbero | Administrador |
| CAR-05 | Horarios de atención del establecimiento, incluidos cierres por fecha | Administrador |
| CAR-06 | Jornada y bloqueos puntuales del barbero | Barbero |
| CAR-07 | Exploración de barberías y servicios | Cliente |
| CAR-08 | Selección explícita de barbero | Cliente |
| CAR-09 | Calendario de disponibilidad **real** | Cliente |
| CAR-10 | Reserva con anticipo del 20 % contra sandbox de la pasarela | Cliente |
| CAR-11 | Comprobante y confirmación de reserva (pagado / saldo pendiente) | Cliente |
| CAR-12 | Cancelación y reprogramación con política explícita | Cliente / Administrador |
| CAR-13 | Prevención de solapamientos, incluso concurrentes | Todos |
| CAR-14 | Agenda general del establecimiento | Administrador |
| CAR-15 | Agenda personal del barbero, desde el teléfono | Barbero |
| CAR-16 | Cierre del turno y ciclo de vida de estados | Barbero |
| CAR-17 | Cuentas propias y acceso por rol | Todos |
| CAR-18 | Diseño adaptable y accesible (uso de pie, con prisa) | Todos |
| CAR-19 | Supervisión de la plataforma | Operador |

---

## 6. Fuera del alcance

Enunciarlo no es una renuncia definitiva: es la frontera contra la cual se contrasta cualquier solicitud
posterior, para que una incorporación exija una decisión consciente y no ocurra por deslizamiento.

- Barberías con **más de una sede**.
- Cobro, registro o conciliación del **80 % restante**.
- **Pagos reales en producción**, manejo de fondos, devoluciones automáticas, conciliación bancaria.
- **Facturación electrónica** y cualquier documento tributario.
- Nómina, comisiones o pagos a barberos.
- **Aplicaciones móviles nativas** (el acceso es web adaptable).
- Inventario y venta de productos.
- Fidelización, cupones, descuentos, bonos, tarifas dinámicas.
- Valoraciones o reseñas públicas.
- Mensajería en tiempo real cliente–barbero.
- Notificaciones por **SMS o mensajería instantánea de terceros**.
- Atención sin reserva previa (fila presencial, orden de llegada, mostrador).
- Tableros de BI, analítica avanzada, predicción de demanda.
- Integración con **calendarios externos** (Google Calendar, Outlook).
- Multi-idioma y multi-moneda.
- Migración de datos históricos de cuadernos, hojas de cálculo o chats.
- Historial clínico capilar o cualquier dato de salud.

---

## 7. Suposiciones vivas

Cada suposición es un riesgo con nombre. Si una se rompe, se recalcula alcance y estimación **sin culpa**.

| Id | Suposición | Si falla |
|---|---|---|
| SUP-01 | Los clientes aceptan pagar el 20 % por anticipado | Se desploma la propuesta de valor → prever reserva sin anticipo configurable |
| SUP-02 | Las barberías mantienen catálogo y horarios al día | Reservas a precios u horarios inexistentes → configuración guiada y avisos |
| SUP-03 | Una barbería = una sede | El modelo no representa cadenas → excluido, pero no cerrar el diseño |
| SUP-04 | El saldo se cobra presencialmente | Aparecen requisitos de caja y facturación |
| SUP-05 | Hay conectividad suficiente al momento de usar | Reservas incompletas y pagos ambiguos → confirmación explícita de estado |
| SUP-06 | Hay demanda inicial de clientes | Las barberías se registran y abandonan → arrancar con pilotos que traigan su clientela |
| SUP-07 | El operador habilita en un plazo breve | Barberías bloqueadas que abandonan → plazo máximo e informe de estado |
| SUP-08 | El flujo en sandbox equivale al de producción salvo credenciales | Habría que rehacer la confirmación → aislar la pasarela tras interfaz propia |

**Dependencias**: DEP-01 infraestructura de despliegue en la nube · DEP-02 zona horaria única America/Bogotá ·
DEP-03 disponibilidad del sandbox de la pasarela (respaldo: simulador propio que respete el mismo contrato).

---

## 8. Arquitectura

**Hexagonal por capas (opción C)**, con una única regla de dependencia:

```
infraestructura ──▶ aplicacion ──▶ dominio
                                     ▲
      (la infraestructura implementa los puertos que el dominio declara)
```

El dominio **no importa** infraestructura, ni bibliotecas externas, ni el framework HTTP, ni el ORM, ni
`Date.now()`. Se prueba sin base de datos, sin red y sin pasarela.

### Estructura de carpetas

El servidor vive en `backend/` y el cliente en `frontend/`; el hexágono es `backend/src/`.
Muchos de estos archivos aún no existen: el árbol fija **dónde** irá cada uno cuando entre, para
que ubicar un concepto nuevo no sea una decisión que se tome dos veces. A hoy solo está construida
la entidad **Barbería** de punta a punta.

```
backend/
├── src/
│   ├── dominio/
│   │   ├── modelo/
│   │   │   ├── Barberia.ts          EstadoBarberia.ts (pendiente_verificacion · habilitada · suspendida)
│   │   │   ├── Servicio.ts          Catalogo.ts
│   │   │   ├── Barbero.ts           Jornada.ts · Ausencia.ts
│   │   │   ├── Cliente.ts
│   │   │   ├── Turno.ts             EstadoTurno.ts
│   │   │   ├── Reserva.ts           Anticipo.ts · Comprobante.ts
│   │   │   ├── HorarioAtencion.ts
│   │   │   └── valores/             IdBarberia.ts · NombreBarberia.ts · DescripcionBarberia.ts
│   │   │                            Ubicacion.ts · MediosContacto.ts
│   │   │                            CorreoElectronico.ts · Telefono.ts
│   │   │                            Dinero.ts · IntervaloTiempo.ts · Duracion.ts
│   │   │
│   │   ├── servicios/
│   │   │   ├── CalculoDisponibilidad.ts     horario ∩ jornada − ausencias − turnos
│   │   │   ├── CalculoAnticipo.ts           el 20 %, en un solo lugar
│   │   │   ├── PoliticaCancelacion.ts       ← Strategy
│   │   │   ├── PoliticaAsignacionEspacios.ts
│   │   │   └── DeteccionSolapamiento.ts
│   │   │
│   │   ├── errores/     ErrorDominio.ts   ErrorDeValidacion · ErrorDeTransicion
│   │   │
│   │   └── puertos/
│   │       └── index.ts     RepositorioBarberias · RepositorioServicios · RepositorioBarberos
│   │                        RepositorioTurnos · RepositorioClientes
│   │                        PasarelaPagos · ServicioNotificacion · Reloj · GeneradorId
│   │
│   ├── aplicacion/
│   │   ├── casos-uso/
│   │   │   ├── barberia/    RegistrarBarberia.ts · HabilitarBarberia.ts · SuspenderBarberia.ts
│   │   │   │                ActualizarPerfilBarberia.ts · ObtenerBarberia.ts
│   │   │   │                ListarBarberiasHabilitadas.ts · ListarBarberiasPorEstado.ts
│   │   │   │                ConfigurarHorarioAtencion.ts
│   │   │   ├── catalogo/    CrearServicio.ts · ActualizarServicio.ts · DesactivarServicio.ts
│   │   │   ├── personal/    VincularBarbero.ts · DefinirJornada.ts
│   │   │   │                SolicitarAusencia.ts · AprobarAusencia.ts
│   │   │   ├── reserva/     ConsultarEspaciosLibres.ts · ReservarTurno.ts
│   │   │   │                ConfirmarPagoAnticipo.ts · CancelarTurno.ts · ReprogramarTurno.ts
│   │   │   ├── agenda/      ConsultarAgendaGeneral.ts · ConsultarAgendaBarbero.ts
│   │   │   │                CerrarTurno.ts · MarcarInasistencia.ts
│   │   │   └── LiberarReservasVencidas.ts   ← lo ejecuta el planificador
│   │   ├── dto/            BarberiaDto.ts    lo que sale de la aplicación hacia el borde
│   │   └── errores/        ErrorAplicacion.ts   fallos de orquestación, no reglas del negocio
│   │
│   ├── infraestructura/
│   │   ├── persistencia/   conexion.ts
│   │   │                   repositorios/  RepositorioBarberiasSQLServer.ts
│   │   │                   mapeadores/    MapeadorBarberia.ts   (fila ⇄ agregado)
│   │   │                   migraciones/   esquema.ts · aplicarEsquema.ts
│   │   ├── pagos/          PasarelaPagosSandbox.ts · SimuladorPagos.ts   (mismo contrato)
│   │   ├── notificaciones/ NotificadorCorreo.ts · NotificadorBitacora.ts
│   │   ├── http/           servidor.ts · controladores/ · rutas/ · middlewares/ · dto/
│   │   ├── seguridad/      Autenticacion.ts · AutorizacionPorRol.ts · ContextoBarberia.ts
│   │   ├── identificadores/ GeneradorIdUuid.ts   (única fuente de identificadores)
│   │   ├── tiempo/         RelojSistema.ts       (única fuente de "ahora")
│   │   └── planificador/   TareaLiberarReservas.ts
│   │
│   └── main.ts             raíz de composición: ÚNICO lugar con `new` de infraestructura
│
└── tests/                  espeja backend/src/
    ├── unidad/             dominio y casos de uso · sin BD, sin red, en milisegundos
    ├── integracion/        adaptadores reales
    ├── e2e/                el flujo completo por HTTP
    └── dobles/             RelojFijo.ts · GeneradorIdSecuencial.ts
                            RepositorioBarberiasEnMemoria.ts · PerfilBarberiaDePrueba.ts
```

**Configuración en la raíz del repositorio**: `package.json` (el del servidor), `tsconfig.json`
(tipado estricto y alias, incluye pruebas), `tsconfig.build.json` (solo compila `backend/src` a
`dist/`) y `eslint.config.js` (la regla de dependencia).

### Puesta en marcha

```bash
npm install
npm run verificar     # typecheck + lint + pruebas: lo mismo que exige la integración continua
npm run probar        # solo la suite unitaria
npm run dev           # servidor en http://localhost:3000  (GET /salud responde {"estado":"ok"})
npm run build         # a dist/ ; luego npm start
```

La conexión a SQL Server entra por variables de entorno, nunca por el código (RES-13):
`BD_SERVIDOR`, `BD_NOMBRE`, `BD_USUARIO`, `BD_CONTRASENA`, y opcionalmente `BD_PUERTO`
(1433), `BD_CIFRADO`, `BD_CONFIAR_CERTIFICADO` y `PUERTO`.

### Frontend

La interfaz se construye con **React + TypeScript**. Es un cliente del sistema, **no una capa del
hexágono**: vive fuera de `backend/` y se comunica exclusivamente por la API HTTP que expone
`infraestructura/http/`. El hexágono no sabe que existe React, y React no conoce el modelo de dominio:
conoce los DTO del borde HTTP.

A hoy el cliente **no está construido**: solo existen las carpetas. Este árbol fija dónde irá cada
pieza, no lo que ya hay.

```
frontend/
├── public/
├── src/
│   ├── paginas/          una por flujo completo
│   │   ├── publico/          Inicio · ExplorarBarberias
│   │   ├── cliente/          SeleccionarServicio · SeleccionarBarbero
│   │   │                     CalendarioEspacios · PagarAnticipo · Comprobante · MisTurnos
│   │   ├── barbero/          AgendaPersonal · CerrarTurno · MiJornada · SolicitarAusencia
│   │   ├── administrador/    PerfilBarberia · Catalogo · Personal · HorarioAtencion
│   │   │                     AgendaGeneral · Ausencias
│   │   └── operador/         BarberiasRegistradas · HabilitarBarberia
│   │
│   ├── componentes/      piezas reutilizables de UI, sin lógica de negocio
│   │   ├── comunes/
│   │   └── agenda/
│   ├── api/              cliente HTTP tipado, un archivo por área: barberias.ts · turnos.ts …
│   ├── tipos/            DTO del borde HTTP (espejo de infraestructura/http/dto)
│   ├── estado/           estado de servidor y formularios
│   ├── estilos/
│   ├── rutas/            enrutado y guardas por rol
│   └── main.tsx
└── tests/
```

**Endpoints disponibles hoy** (`/api`), todos de la entidad Barbería:

| Método y ruta | Quién | Qué hace |
|---|---|---|
| `GET /barberias` | Cliente | Catálogo público: solo habilitadas. Filtros `?ciudad=` y `?texto=` |
| `POST /barberias` | Administrador | Registra una barbería en PENDIENTE_VERIFICACION |
| `GET /barberias/:id` | Administrador / Operador | Detalle completo |
| `PUT /barberias/:id` | Administrador | Actualiza el perfil de **su** barbería |
| `GET /operador/barberias?estado=` | Operador | Bandeja por estado |
| `POST /operador/barberias/:id/habilitacion` | Operador | Habilita |
| `POST /operador/barberias/:id/suspension` | Operador | Suspende, con motivo obligatorio |

Las guardas por rol (CAR-17) todavía no existen: hoy el solicitante se declara en el cuerpo de la
petición. Entran con el caso de uso de identidad y ahí dejan de ser un dato que el cliente elige.

**Reglas del cliente**

- **Ninguna regla de negocio se reimplementa en React.** El 20 %, la política de cancelación y los
  espacios libres los calcula y los devuelve el servidor. Si el cliente necesita saber una regla, la
  pide; no la deduce.
- **Los estados del turno se muestran, no se derivan.** El texto y el color salen del estado que envía
  la API, no de comparar fechas en el navegador.
- **Adaptable de verdad** (CAR-18, RES-01): el barbero la usa de pie, con una mano, en un local ruidoso.
  Contraste, tamaños de toque y navegación corta mandan sobre la densidad de información.
- **Nada de datos de tarjeta en el navegador propio** (RES-13): el pago del anticipo se delega al widget
  o a la página de la pasarela; la aplicación solo maneja la referencia de la transacción.
- **Los horarios se presentan siempre en America/Bogotá** (DEP-02), formateados en el borde, nunca
  recalculando zonas en cada componente.
- **Español** en la interfaz y en los nombres de los componentes, igual que en el servidor.

### Dónde aterrizan los patrones

| Patrón | Dónde | Por qué |
|---|---|---|
| **Strategy** | `PoliticaCancelacion`, `PoliticaAsignacionEspacios` | La regla del anticipo ante una cancelación cambia sin tocar el caso de uso |
| **Adapter** | `PasarelaPagosSandbox`, `NotificadorCorreo`, `RepositorioTurnosSQL` | Cambiar de proveedor no toca el dominio (SUP-08, DEP-03) |
| **State** | `Turno` + `EstadoTurno` | Las transiciones inválidas se vuelven imposibles, no improbables |
| **Observer** | Eventos del turno → notificaciones e historial | Confirmar una reserva no debe saber a quién hay que avisar |
| **Repository** | `dominio/puertos` | El dominio habla de `guardar`, `turnosDe`, `espaciosLibres`; nunca de SQL |

### Cómo se hace cumplir la regla

`eslint.config.js`:

```js
{
  files: ["backend/src/dominio/**/*.ts"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        { group: ["**/infraestructura/**"], message: "El dominio no importa infraestructura." },
        { group: ["**/aplicacion/**"],      message: "El dominio no conoce los casos de uso." },
        { group: ["express", "mssql"],      message: "El dominio no conoce el framework HTTP ni el driver." },
      ],
    }],
  },
}
```

Hay un bloque equivalente para `backend/src/aplicacion/**`, que tampoco puede importar
infraestructura: depende de los puertos que declara el dominio. `npm run lint` falla en rojo si
alguien cruza la frontera.

Verificación de emergencia:

```bash
grep -rn "from ['\"].*infraestructura" backend/src/dominio/ && echo "❌ DIP roto" || echo "✅ dominio limpio"
```

---

## 9. Convenciones

- **Nombres en el idioma del negocio.** `ReservarTurno`, no `BookingService`. `LiberarReservasVencidas`,
  no `ReservationProcessor`.
- **Nada de `GestorX` ni `ServicioX` genéricos.** Un nombre que sirve para todo no describe nada.
- **Nada de `utils/` ni `helpers/`.** Son carpetas sin criterio de pertenencia: todo cabe y nada se
  encuentra. Si algo no tiene dónde ir, es que le falta un nombre.
- **Un archivo, un concepto exportado.** `index.ts` que reexporta, solo en `dominio/puertos/`.
- **`tests/` espeja `src/`.** Encontrar la prueba de un archivo no debe requerir buscar.
- **Alias de importación** declarados en `tsconfig.json` (`"@dominio/*": ["backend/src/dominio/*"]`)
  para evitar `../../../`. Ojo: `tsc` no reescribe los alias al emitir, así que el código de
  `backend/src/` usa rutas relativas hasta que se añada un resolutor en el build.
- **`main.ts` es el único archivo que puede importarlo todo.** Si un segundo empieza a hacerlo, hay un
  problema de diseño.
- **El tiempo entra por el puerto `Reloj`.** Ningún `new Date()` dentro de `dominio/` ni de
  `aplicacion/`: rompe la reproducibilidad de las pruebas.
- **El dinero es un objeto de valor `Dinero` en COP.** Nunca un `number` suelto: el 20 % y el redondeo
  viven en un solo sitio.
- **Los instantes se persisten en UTC y se presentan en America/Bogotá.** La conversión ocurre en los
  bordes, no en el dominio.

---

## 10. Atributos de calidad (ISO/IEC 25010)

| Atributo | Compromiso |
|---|---|
| **Fiabilidad** | La liberación de reservas vencidas es **idempotente**: repetir la ejecución no cancela dos veces el mismo turno |
| **Mantenibilidad** | El dominio se prueba sin base de datos ni red; la suite unitaria corre en menos de un segundo |
| **Seguridad** | Autorización por rol **y por barbería** en cada operación; ningún dato personal ni de pago en bitácoras |
| **Usabilidad** | Consultar la agenda o cerrar un turno se hace de pie, desde el teléfono, en pocos toques |
| **Portabilidad** | Cambiar el motor de persistencia o la pasarela no modifica una línea del dominio |
| **Eficiencia** | El cálculo de espacios libres responde de inmediato al abrir el calendario del barbero |

---

## 11. Proceso y entregas

- **Scrum**, sprints de duración fija, una entrega demostrable por corte académico (tres cortes en 2026-03).
- **GitFlow** e integración continua: ninguna entrega se acepta con la construcción en rojo.
- Cada entrega compara el **esfuerzo estimado contra el esfuerzo real** medido.
- **Node.js + TypeScript con tipado estricto** en el servidor y **React** en el cliente
  (plan de curso 103093).
- Los cambios acordados **entran al backlog, no al sprint en curso**.
- Sin presupuesto: solo herramientas libres, gratuitas o de bajo costo (RES-09).

---

## 12. Documentos de referencia del proyecto

| Documento | Contenido |
|---|---|
| `DocumentoDeVision-KronoBarber-V1.1.docx` | Fuente de verdad del alcance, los interesados, las características y las restricciones |
| `Idea_general_del_proyecto` | Descripción original de la que parte el producto |
| `documento-vision.md` | Plantilla y guía del curso para el documento de visión |
| `estructura-carpetas-node.md` | Las cuatro alternativas de estructura y por qué se eligió la hexagonal |
| `VisionHelpdeskUAM.pdf` | Documento de visión de ejemplo del curso (HelpDesk UAM), usado como referencia de forma |
