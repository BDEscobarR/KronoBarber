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
| **P-03** | Servicios, precios, personal, horarios y ausencias en registros dispersos | Administración centralizada donde registrar un permiso cambia de inmediato la disponibilidad publicada |

---

## 2. Actores y roles

| Rol | Qué hace | Alcance de lo que ve |
|---|---|---|
| **Operador de la plataforma** | Verifica y **habilita** barberías, **suspende** las que incumplen políticas, supervisa la operación | Transversal: no pertenece a ninguna barbería |
| **Administrador de barbería** | Perfil del negocio, catálogo de servicios, personal (vincular y desvincular barberos), horarios de atención, jornada, ausencias y bloqueos de sus barberos, agenda general | **Solo su propia barbería** |
| **Barbero** | Consulta su agenda, cierra sus turnos y registra la observación de cierre. Su jornada, sus días libres, sus permisos y sus bloqueos se los comunica al administrador, que es quien los registra (D-16) | **Solo su propia agenda** |
| **Cliente** | Explora barberías, elige servicio y barbero, reserva pagando el anticipo, cancela o reprograma | Barberías **habilitadas** y sus propios turnos |

---

## 3. Vocabulario del dominio (obligatorio en el código)

El código se escribe **en español** con estos nombres exactos. Si un concepto no está aquí, probablemente
no exista todavía en el dominio.

| Término | Significado preciso |
|---|---|
| **Barbería** | Establecimiento de **una sola sede**. Es la unidad de aislamiento de los datos (tenant). |
| **Barbero** | `Usuario` con rol `BARBERO`, vinculado a una barbería. **No es una entidad aparte**: su barbería es `barberiaId`, la cuenta la crea el administrador de esa barbería y desvincularlo es desactivar su cuenta: pierde el acceso de inmediato. |
| **Servicio** | Prestación con nombre, precio y **duración estimada**. La duración determina el tamaño del turno. |
| **Catálogo** | Servicios vigentes de una barbería. Un servicio se **desactiva**, nunca se borra. |
| **Turno** | Intervalo comprometido entre un cliente y un barbero para un servicio. Unidad central del sistema. |
| **Reserva** | Acto de solicitar un turno. **Solo se considera confirmada cuando se pagó el anticipo.** |
| **Anticipo** | 20 % del valor del servicio, pagado en línea. Convierte la cita en compromiso económico. |
| **Saldo** | 80 % restante. Se paga presencialmente y **no pasa por la plataforma**. |
| **Horario de atención** | Días y franjas en que abre la barbería. Límite exterior de toda disponibilidad. |
| **Jornada** | Franja propia del barbero **dentro** del horario del establecimiento. La define el barbero, pero la registra y modifica su administrador. |
| **Ausencia** | Día libre, permiso o bloqueo puntual (un rato de la jornada en que no atiende). La registra el administrador, sin solicitud ni aprobación, y retira disponibilidad de inmediato. |
| **Disponibilidad** | Horario de atención ∩ jornada − ausencias − turnos ya reservados. |
| **Espacio libre** | Intervalo continuo de la disponibilidad, **de duración suficiente para el servicio elegido**. Es lo único que el cliente ve. |
| **Solapamiento** | Coincidencia total o parcial de dos turnos del mismo barbero. El sistema debe impedirlo incluso ante reservas concurrentes. |
| **Reprogramación** | Traslado de un turno confirmado a otro espacio libre, conservando el anticipo según la política. |
| **Cancelación** | Terminación anticipada, con el tratamiento del anticipo que fije la política **comunicada antes del pago**. |
| **Inasistencia** | Turno confirmado al que el cliente no se presenta. Es un **estado del ciclo de vida**, no un incidente suelto. |
| **Agenda** | Vista de turnos en el tiempo: **general** (todo el establecimiento) o **personal** (un barbero). |
| **Observación de cierre** | Nota estructurada del barbero al finalizar la atención; se incorpora al historial del cliente. |
| **Habilitación / Suspensión** | Autorización (o su retiro) del operador para que una barbería reciba reservas. Solo se suspende una barbería habilitada, siempre con motivo. Suspendida, no se ve ni recibe reservas, pero su administrador puede seguir editándola para corregir el problema. |
| **Pasarela de pagos** | Servicio externo que procesa el anticipo. La plataforma **no** almacena medios de pago. |
| **Sandbox** | Modo de la pasarela que reproduce el flujo completo sin dinero real. |

**Prefijos de identificador del Documento de Visión** (referenciarlos, no repetir su enunciado):
`P-` problemas · `NC-` necesidades clave · `SUP-` suposiciones · `DEP-` dependencias ·
`CAR-` características · `RES-` restricciones.

---

## 4. Reglas de negocio que no se negocian

Estas son las invariantes del dominio. Cada una debería tener una prueba unitaria con su nombre.

1. **El anticipo es del 20 % exacto**, sin excepciones configurables por barbería en esta versión (RES-03).
   Como la operación es en pesos enteros, el 20 % casi nunca cae exacto: se **redondea al peso más
   cercano**, con la mitad hacia arriba. El saldo se obtiene **restando** el anticipo del total, nunca
   calculando un 80 % aparte, para que anticipo + saldo sume siempre el precio del servicio. Ese
   redondeo vivirá en **una sola función pura del dominio**, que entra con la historia de reserva
   (CAR-10). Hoy el precio del servicio ya se guarda en pesos enteros y se valida con `esPrecioValido`.
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
La columna **Estado** refleja `develop` al 2026-10-24; los `D-` son decisiones del §13.

| Id | Característica | Perfil | Estado |
|---|---|---|---|
| CAR-01 | Registro y perfil de barbería | Administrador | **Hecho**: registro y edición del perfil |
| CAR-02 | Habilitación y suspensión de barberías | Operador | **Parcial**: la habilitación está completa; la suspensión todavía no pide motivo |
| CAR-03 | Catálogo de servicios (precio, duración, activar/desactivar) | Administrador | **Hecho**: crear, editar, catálogo de gestión y activar o desactivar |
| CAR-04 | Gestión del personal y de los servicios que presta cada barbero | Administrador | Pendiente (Fase 3). El barbero es un `Usuario` |
| CAR-05 | Horarios de atención del establecimiento, incluidos cierres por fecha | Administrador | **Parcial**: se configura, pero todavía no se consulta |
| CAR-06 | Jornada y bloqueos puntuales del barbero | Barbero | Pendiente (Fase 3). Los registra el administrador (D-16), no el barbero como dice el Documento de Visión |
| CAR-07 | Exploración de barberías y servicios | Cliente | **Hecho**: barberías habilitadas por ciudad y vitrina de servicios activos |
| CAR-08 | Selección explícita de barbero | Cliente | Pendiente (fases 3 y 7) |
| CAR-09 | Calendario de disponibilidad **real** | Cliente | Pendiente (Fase 7) |
| CAR-10 | Reserva con anticipo del 20 % contra sandbox de la pasarela | Cliente | Pendiente (Fase 8) |
| CAR-11 | Comprobante y confirmación de reserva (pagado / saldo pendiente) | Cliente | Pendiente (Fase 8) |
| CAR-12 | Cancelación y reprogramación con política explícita | Cliente / Administrador | Pendiente (Fase 8) |
| CAR-13 | Prevención de solapamientos, incluso concurrentes | Todos | Pendiente: solo existe `seSolapan`, usada entre franjas del horario |
| CAR-14 | Agenda general del establecimiento | Administrador | Pendiente (Fase 6) |
| CAR-15 | Agenda personal del barbero, desde el teléfono | Barbero | Pendiente (Fase 6). Sin frontend, se entrega como API |
| CAR-16 | Cierre del turno y ciclo de vida de estados | Barbero | Pendiente (Fase 6) |
| CAR-17 | Cuentas propias y acceso por rol | Todos | **Parcial**: entidad `Usuario` completa; sin registro, inicio de sesión ni guardas |
| CAR-18 | Diseño adaptable y accesible (uso de pie, con prisa) | Todos | **Fuera del alcance**: no habrá frontend (D-01) |
| CAR-19 | Supervisión de la plataforma | Operador | **Parcial**: bandeja de barberías por estado |

---

## 6. Fuera del alcance

Enunciarlo no es una renuncia definitiva: es la frontera contra la cual se contrasta cualquier solicitud
posterior, para que una incorporación exija una decisión consciente y no ocurra por deslizamiento.

- Barberías con **más de una sede**.
- Cobro, registro o conciliación del **80 % restante**.
- **Pagos reales en producción**, manejo de fondos, devoluciones automáticas, conciliación bancaria.
- **Facturación electrónica** y cualquier documento tributario.
- Nómina, comisiones o pagos a barberos.
- **Cliente web propio y aplicaciones móviles nativas**: la entrega es la API, documentada en `/api/docs`
  (decisión del 2026-10-24). Con esto sale CAR-18.
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

**Hexagonal (puertos y adaptadores)**, con una única regla de dependencia:

```
infraestructura ──▶ aplicacion ──▶ dominio
                                     ▲
      (la infraestructura implementa los puertos que el dominio declara)
```

El dominio **no importa** infraestructura, ni el framework HTTP, ni el ORM. Se prueba sin base de datos
y sin red.

### Stack

| Elemento | Valor |
|---|---|
| Lenguaje | **TypeScript** estricto, más `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes` |
| Runtime | **Node.js 20.12 o superior** (probado en 24.19). `"type": "commonjs"` + `"module": "nodenext"`: los imports no llevan extensión |
| HTTP | **Express 5**, con documentación interactiva en **Swagger UI** (`/api/docs`) |
| Base de datos | **SQL Server 2022** (la edición Express sirve) instalado en la máquina. **Sin Docker** |
| ORM | **Prisma 7** con el adaptador `@prisma/adapter-mssql` |
| Pruebas | **Vitest** |

Lo que deliberadamente **no** se usa: `zod`/`class-validator` (la validación se escribe a mano en la
frontera HTTP), `dotenv` (se usa `--env-file` de Node), `eslint` (la regla de dependencias la verifica una
prueba), decoradores, contenedores de inyección de dependencias.

### Estructura de carpetas

El repositorio es solo el servidor: `prisma/`, `src/` y `tests/` en la
raíz. El árbol refleja lo que **existe hoy**: no se crean carpetas vacías por adelantado, una capa entra
cuando una historia de usuario la necesita.

```
KronoBarber/
├── prisma/
│   ├── schema.prisma                  esquema de la BD (fuente de verdad del ORM)
│   └── migrations/                    SQL generado por `prisma migrate dev` (se versiona): inicial, usuarios, horario_atencion
│
├── src/
│   ├── dominio/                       el negocio: no importa nada de afuera
│   │   ├── modelo/
│   │   │   ├── Barberia.ts            entidad + EstadoBarberia + PerfilBarberia + BarberiaDTO + aBarberiaDTO()
│   │   │   ├── Servicio.ts            entidad + reglas de precio y duración + ServicioDTO
│   │   │   ├── Usuario.ts             entidad + RolUsuario + perteneceABarberia() + UsuarioDTO (sin claveHash)
│   │   │   └── HorarioAtencion.ts     entidad + DiaSemana + Franja + guardas de hora y fecha + seSolapan() (semilla de la regla 5)
│   │   └── puertos/
│   │       └── index.ts               BarberiaDAO, ServicioDAO, UsuarioDAO y HorarioAtencionDAO
│   │
│   ├── aplicacion/                    orquestación de las reglas
│   │   └── casos-uso/
│   │       ├── RegistrarBarberia.ts   caso de uso + RegistroBarberiaDTO + CorreoDeBarberiaYaRegistrado
│   │       ├── ActualizarPerfilBarberia.ts  caso de uso + ActualizacionPerfilBarberiaDTO + BarberiaSuspendida
│   │       ├── HabilitarBarberia.ts   caso de uso + BarberiaNoEncontrada + BarberiaYaHabilitada
│   │       ├── SuspenderBarberia.ts   caso de uso + BarberiaYaSuspendida
│   │       ├── ConfigurarHorarioAtencion.ts  caso de uso + ConfiguracionHorarioDTO + FranjaSemanal + HorarioInvalido
│   │       ├── CrearServicio.ts       caso de uso + CreacionServicioDTO + ServicioYaExiste
│   │       ├── ActualizarServicio.ts  caso de uso + ActualizacionServicioDTO + ServicioNoEncontrado
│   │       ├── DesactivarServicio.ts  caso de uso + ServicioYaInactivo
│   │       └── ActivarServicio.ts     caso de uso + ServicioYaActivo
│   │
│   ├── infraestructura/               lo reemplazable: aquí vive la tecnología
│   │   ├── persistencia/
│   │   │   ├── prisma.ts              PrismaClient con el adaptador de SQL Server
│   │   │   ├── BarberiaDAOPrisma.ts   adaptador: implementa BarberiaDAO con Prisma
│   │   │   ├── ServicioDAOPrisma.ts   adaptador: implementa ServicioDAO con Prisma
│   │   │   ├── UsuarioDAOPrisma.ts    adaptador: implementa UsuarioDAO con Prisma
│   │   │   ├── HorarioAtencionDAOPrisma.ts  adaptador: implementa HorarioAtencionDAO con Prisma
│   │   │   └── generado/              (no versionado) cliente generado por Prisma
│   │   └── http/
│   │       ├── servidor.ts            arma la app Express: prefijo /api, Swagger, 404, errores
│   │       ├── openapi.ts             contrato OpenAPI 3.0.3 como objeto TS
│   │       └── rutas/
│   │           ├── barberias.ts       validación de frontera + handlers de barberías y de su horario
│   │           └── servicios.ts       validación de frontera + handlers del catálogo
│   │
│   └── main.ts                        raíz de composición: el único con `new`
│
├── tests/
│   ├── unidad/                        barberias, servicios, horario y usuarios: casos de uso y reglas, sin BD ni red
│   ├── dobles/                        BarberiaDAOEnMemoria, ServicioDAOEnMemoria, UsuarioDAOEnMemoria y HorarioAtencionDAOEnMemoria
│   └── arquitectura.test.ts           verifica la regla de dependencias
│
├── .env.example                       plantilla de variables (sí se versiona)
├── .gitignore
├── package.json
├── prisma.config.ts                   configuración del CLI de Prisma 7
├── tsconfig.json
└── vitest.config.ts
```

Equivalencias para quien venga de MVC:

| Concepto MVC | Aquí se llama | Ubicación |
|---|---|---|
| `models/` | Entidades de dominio | `src/dominio/modelo/` |
| `repositories/` (interfaz) | Puertos `...DAO` | `src/dominio/puertos/index.ts` |
| `repositories/` (implementación) | Adaptadores `...DAOPrisma` | `src/infraestructura/persistencia/` |
| `services/` | Casos de uso | `src/aplicacion/casos-uso/` |
| `controllers/` + `routes/` | Handlers dentro del `Router` | `src/infraestructura/http/rutas/` |
| `middlewares/` | Funciones que devuelven `RequestHandler` | Junto a la ruta que las usa |
| `dtos/` | Sin carpeta: cada DTO junto a quien lo usa | ver abajo |
| `config/` + inyección de dependencias | Raíz de composición | `src/main.ts` |
| `utils/` / `helpers/` | **Prohibido por convención** | No aplica |

### Cómo está hecha cada entidad

**Hay dos definiciones de cada entidad, a propósito:**

| | Dónde | Qué es |
|---|---|---|
| Modelo de persistencia | `prisma/schema.prisma` | Cómo se guarda en SQL Server: `@id`, `@unique`, `@db.NVarChar`, columnas de auditoría (`creadoEn`) |
| Entidad de dominio | `src/dominio/modelo/*.ts` | Qué es para el negocio: una `interface` de TypeScript pura, sin decoradores ni dependencia del ORM |

Entre las dos está la función `aDominio()` del adaptador DAO. Esa separación es lo que permite cambiar de
ORM sin tocar el dominio. Cada archivo de `modelo/` tiene las mismas cinco piezas:

1. Los estados como **array `as const` + tipo derivado** (de `ESTADOS_BARBERIA` se deriva `EstadoBarberia`), no `enum`
   de TypeScript. El mismo array valida datos y alimenta el `enum` de OpenAPI.
2. La **entidad sin sufijo** (`Barberia`, `Servicio`).
3. El tipo para creación: `BarberiaNueva = Omit<Barberia, 'id'>`. El id lo asigna la base de datos.
4. El **DTO de salida** (`BarberiaDTO`): lo que cruza por HTTP. `BarberiaDTO` no tiene `motivoSuspension`,
   así que ese dato interno del operador no puede filtrarse por descuido. Por la misma razón, `UsuarioDTO`
   no tiene `claveHash`.
5. **Funciones puras**: guardas de tipo (`esEstadoBarberia`, `esRolUsuario`, `esPrecioValido`,
   `esDuracionValida`, `esDiaSemana`, `esHoraValida`, `esFechaValida`), reglas (`esVisibleParaClientes`,
   `perteneceABarberia`, `seSolapan`) y el mapeador a DTO (`aBarberiaDTO`), la única puerta de salida.

**`Catalogo` no es una clase, y es deliberado.** El §3 lo define como *los servicios vigentes de una
barbería*, pero eso es una **consulta** (`ServicioDAO.activosDe`), no una entidad con estado propio.

### Convención de sufijos

| Sufijo | Significa | Ejemplos |
|---|---|---|
| `...DTO` | Estructura que **cruza una frontera**. Solo campos. | `BarberiaDTO`, `RegistroBarberiaDTO`, `CreacionServicioDTO` |
| `...DAO` | Contrato de **acceso a datos**, en vocabulario del negocio (`guardar`, `porId`, `activosDe`). | `BarberiaDAO` (puerto); `BarberiaDAOPrisma` y `BarberiaDAOEnMemoria` (implementaciones) |
| sin sufijo | Entidades y puertos de comportamiento. | `Barberia`, `Servicio`, `EstadoBarberia` |

Un DTO vive **junto al código que lo usa**: el de salida de una entidad, con la entidad; el de entrada de
un caso de uso, con el caso de uso; uno puramente HTTP, con la ruta.

### Casos de uso y rutas

Cada caso de uso es **una clase, con dependencias `private readonly` por constructor y un único método
`ejecutar()`**. Solo importa del dominio, y en el mismo archivo declara su DTO de entrada y sus errores de
negocio (`CorreoDeBarberiaYaRegistrado`). La normalización (`trim`, correo en minúsculas, teléfono sin
separadores) es del caso de uso, no de HTTP.

Cada archivo de `rutas/` tiene cuatro bloques: validación de frontera (`validarRegistro(cuerpo: unknown):
RegistroBarberiaDTO | string`, donde el string es el mensaje del 400), la interfaz `Dependencias...`, los
middlewares si hacen falta y la fábrica del `Router`. Cada handler hace siempre lo mismo: validar (si falla, `400`);
llamar al caso de uso; responder con el DTO; traducir errores de negocio a HTTP (`409`, `404`) y delegar el
resto a `next(error)`. **El dominio no sabe qué es un 409.**

### Conexión a SQL Server (sin Docker)

La base de datos es un **SQL Server instalado en la máquina** (servicio de Windows), no un contenedor.
La configuración entra por variables de entorno, nunca por el código (RES-13):

| Variable | Para qué | ¿Obligatoria? |
|---|---|---|
| `BD_SERVIDOR` | Host de SQL Server | Sí |
| `BD_PUERTO` | Puerto TCP | No (1433) |
| `BD_NOMBRE` | Base de datos de la aplicación | Sí |
| `BD_USUARIO` y `BD_CONTRASENA` | Login de SQL Server | Sí |
| `BD_CIFRADO` | `false` desactiva el cifrado de la conexión | No (`true`) |
| `BD_CONFIAR_CERTIFICADO` | `true` acepta el certificado autofirmado de un SQL Server local | No (`false`) |
| `PUERTO` | Puerto HTTP | No (3000) |

Las mismas variables sirven a los dos consumidores:

- **En ejecución**, `src/infraestructura/persistencia/prisma.ts` arma el objeto de configuración de
  `PrismaMssql`, que no acepta URL, y **falla temprano** con un mensaje que dice qué hacer si falta alguna.
- **Para el CLI** (`migrate`, `studio`), `prisma.config.ts` compone con ellas la URL `sqlserver://...` y la
  de la **base sombra** `<BD_NOMBRE>_sombra`.

Diferencias con PostgreSQL que condicionan el esquema:

| Tema | En SQL Server con Prisma | Cómo se resolvió |
|---|---|---|
| `enum` | **No soportado** | `estado` (Barberia), `rol` (Usuario) y `diaSemana` (HorarioAtencion) son `String`. La lista válida vive en el dominio y el DAO la comprueba al leer |
| `onDelete: Restrict` | **No soportado** (error de validación) | `NoAction`, que produce el mismo efecto: una barbería con catálogo, personal u horario no se puede borrar |
| Base sombra de `migrate dev` | Crearla automáticamente exige ser administrador del servidor | Se crea una vez a mano (`KronoBarber_sombra`) y `prisma.config.ts` la declara |
| Mayúsculas | La intercalación por defecto no las distingue | "Corte clásico" y "CORTE CLÁSICO" chocan en el `@@unique([barberiaId, nombre])`, que es lo que se quiere |
| Fecha sin hora (cierres del horario) | `@db.Date` llega a JavaScript como `Date`, y pasarla por la zona local la corre un día | El adaptador escribe `YYYY-MM-DDT00:00:00.000Z` y lee con `toISOString().slice(0, 10)`: la fecha nunca pasa por la zona local |

### Puesta en marcha

**Requisitos**: Node.js 20.12 o superior; SQL Server 2022 con **TCP/IP habilitado en el puerto 1433**
(SQL Server Configuration Manager) y **autenticación mixta** (SQL Server y Windows).

**Preparación única de la base de datos**, con un usuario administrador (por ejemplo
`sqlcmd -S localhost -E -C`):

```sql
CREATE LOGIN kronobarber WITH PASSWORD = 'una-clave-local-segura', CHECK_POLICY = OFF;
CREATE DATABASE KronoBarber;
CREATE DATABASE KronoBarber_sombra;   -- la base sombra que usa `prisma migrate dev`
GO
USE KronoBarber;
CREATE USER kronobarber FOR LOGIN kronobarber;
ALTER ROLE db_owner ADD MEMBER kronobarber;
GO
USE KronoBarber_sombra;
CREATE USER kronobarber FOR LOGIN kronobarber;
ALTER ROLE db_owner ADD MEMBER kronobarber;
GO
```

**Secuencia completa**, desde la raíz del repositorio:

```bash
npm install                      # el postinstall genera el cliente de Prisma
cp .env.example .env             # en PowerShell: Copy-Item .env.example .env; luego poner la contraseña
npm run db:migrate               # aplica las migraciones (crea las tablas Barberia, Servicio, Usuario y HorarioAtencion)
npm run dev                      # KronoBarber escuchando en http://localhost:3000/api (documentación en /api/docs)
```

> Instala las versiones del `package.json` tal cual. Hoy la etiqueta `latest` de `prisma` en npm apunta a
> una versión candidata de Prisma 8, mientras `@prisma/client` y `@prisma/adapter-mssql` van en 7.10:
> un `npm install prisma` sin versión los desalinea.

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Ejecuta `src/main.ts` con `tsx`, sin compilar y recargando al guardar. Carga `.env` con `--env-file` |
| `npm run build` | `tsc`: compila `src/` y `tests/` a `dist/` |
| `npm start` | Ejecuta el JS compilado (`dist/src/main.js`). Requiere `build` |
| `npm test` | Vitest en modo watch |
| `npm run cov` | Vitest una pasada con cobertura (puede pedir instalar `@vitest/coverage-v8`) |
| `npm run db:migrate` | `prisma migrate dev`: genera el SQL en `prisma/migrations/` y lo aplica. En Prisma 7 **no** regenera el cliente |
| `npm run db:studio` | Explorador visual de datos de Prisma |
| `npm run arquitectura` | Falla si `dominio/` o `aplicacion/` importan infraestructura, Express o Prisma |
| `postinstall` | Automático tras `npm install`: `prisma generate` |

**Cuando cambies el esquema**: edita `prisma/schema.prisma`, corre `npm run db:migrate` (pide un nombre
descriptivo) y después `npx prisma generate` para que TypeScript vea los cambios. Las migraciones **se
versionan siempre** y no se editan a mano. Al traer una migración de otro integrante basta con
`npm run db:migrate` seguido de `npx prisma generate`.

### Endpoints disponibles hoy (`/api`)

| Método | Ruta | Qué hace | Errores |
|---|---|---|---|
| `GET` | `/salud` | Verificación de vida, sin tocar la base de datos | Ninguno |
| `GET` | `/docs` y `/openapi.json` | Swagger UI y contrato OpenAPI. **Todavía no incluyen** la suspensión | Ninguno |
| `POST` | `/barberias` | Recibe `RegistroBarberiaDTO` y responde `201` con `BarberiaDTO` en `PENDIENTE_VERIFICACION` (CAR-01). Hoy es anónimo | `400`; `409` correo repetido |
| `GET` | `/barberias?ciudad=` | Catálogo público: **solo habilitadas** (CAR-07, RES-11) | Ninguno |
| `GET` | `/barberias?estado=` | Bandeja del operador: las barberías en ese estado, de cualquier ciudad (CAR-19). Si viene `estado`, `ciudad` se ignora | `400` estado desconocido |
| `GET` | `/barberias/:id` | Detalle, en cualquier estado | `404` |
| `PUT` | `/barberias/:id` | Recibe `ActualizacionPerfilBarberiaDTO` (los mismos campos del registro) y responde `200` con `BarberiaDTO`: reemplaza nombre, ubicación, contacto y descripción, sin cambiar el estado (CAR-01). Rechaza una barbería suspendida | `400`; `404`; `409` suspendida o correo de otra barbería |
| `POST` | `/barberias/:id/habilitacion` | El operador habilita, desde pendiente o suspendida (CAR-02) | `404`; `409` ya habilitada |
| `POST` | `/barberias/:id/suspension` | El operador suspende, **sin cuerpo y sin motivo**, desde pendiente o habilitada (CAR-02) | `409` ya suspendida. Una barbería inexistente responde `500`, no `404` |
| `PUT` | `/barberias/:id/horario` | Recibe `ConfiguracionHorarioDTO` (`franjas` con `diaSemana`, `inicio`, `fin` en `HH:MM`, y `cierres` en `YYYY-MM-DD`) y **reemplaza el horario completo**; responde `200` con lo guardado (CAR-05). Admite jornada partida y franjas contiguas, en cualquier estado de la barbería. Todavía no hay `GET` para consultarlo | `400` formato, franja que no avanza, franjas solapadas o cierre repetido; `404` |
| `POST` | `/barberias/:barberiaId/servicios` | Recibe `CreacionServicioDTO` y responde `201` con `ServicioDTO`, activo (CAR-03) | `400`; `404`; `409` nombre repetido |
| `GET` | `/barberias/:barberiaId/servicios?todos=` | Sin `todos`, vitrina: servicios activos, **solo si la barbería está habilitada**. Con `todos=true`, catálogo de gestión: también los inactivos (campo `activo`), en cualquier estado de la barbería (CAR-03) | `400` `todos` no es `true` ni `false`; `404` |
| `PUT` | `/barberias/:barberiaId/servicios/:id` | Recibe `nombre`, `precio` y `duracionMinutos` y responde `200` con `ServicioDTO`. Vale también sobre inactivos y conserva el estado. No edita la descripción (CAR-03) | `400`; `404` el servicio no es de esa barbería; `409` nombre repetido |
| `POST` | `/barberias/:barberiaId/servicios/:id/desactivacion` | **Sin cuerpo.** Retira el servicio de la vitrina sin borrarlo y responde `200` con `ServicioDTO` en `activo: false`. Sigue en el catálogo de gestión y se puede editar (CAR-03, D-04) | `404` el servicio no es de esa barbería o no existe; `409` ya estaba inactivo |
| `POST` | `/barberias/:barberiaId/servicios/:id/activacion` | **Sin cuerpo.** Vuelve a ofrecer el servicio y responde `200` con `ServicioDTO` en `activo: true` (CAR-03, D-04) | `404` el servicio no es de esa barbería o no existe; `409` ya estaba activo |

La ruta de suspensión tiene defectos conocidos, y la edición del perfil y del servicio cambian por
decisiones del §13. Todo eso se corrige en los casos #9, #10 y #12, reabiertos y corregidos cada uno en su
rama original.

Las guardas por rol (CAR-17) todavía no existen: hoy todos los endpoints son abiertos. La entidad ya
existe: `Usuario`, con `rol` (`OPERADOR`, `ADMINISTRADOR`, `BARBERO` o `CLIENTE`), `barberiaId` solo para el
administrador y el barbero, `activo` y su `UsuarioDAO`. Faltan el registro, el inicio de sesión y los
middlewares que exijan la sesión y el rol.

**Un barbero es un `Usuario` con rol `BARBERO`** (decisión del 2026-10-19, issues #17 y #18). No existe
entidad ni tabla `Barbero`: la tabla puente barbero–servicio, la jornada, las ausencias y los turnos
apuntan a `Usuario.id`, y desvincular a un barbero es desactivar su cuenta (`activo = false`). El barbero
no se registra por su cuenta: la crea el administrador de su barbería. Como la base de datos no puede
exigir que ese usuario tenga rol `BARBERO`, esa regla la comprueba el dominio.

Prueba de humo (Git Bash; en PowerShell usar `curl.exe`, o directamente *Try it out* en `/api/docs`).
`<ID>` es el de la barbería y `<SERVICIO>` el del servicio creado. La suspensión va al final porque deja
la barbería fuera del catálogo y con el perfil bloqueado:

```bash
curl -X POST http://localhost:3000/api/barberias -H "Content-Type: application/json" \
  -d '{"nombre":"Barbería El Clásico","direccion":"Calle 65 # 23-10","ciudad":"Manizales","telefono":"(606) 887-1234","correo":"contacto@elclasico.co"}'
curl -X PUT http://localhost:3000/api/barberias/<ID> -H "Content-Type: application/json" \
  -d '{"nombre":"Barbería El Clásico","descripcion":"Cortes clásicos y arreglo de barba.","direccion":"Calle 65 # 23-10","ciudad":"Manizales","telefono":"(606) 887-1234","correo":"contacto@elclasico.co"}'
curl "http://localhost:3000/api/barberias?estado=PENDIENTE_VERIFICACION"
curl -X POST http://localhost:3000/api/barberias/<ID>/habilitacion
curl -X PUT http://localhost:3000/api/barberias/<ID>/horario -H "Content-Type: application/json" \
  -d '{"franjas":[{"diaSemana":"LUNES","inicio":"08:00","fin":"12:00"},{"diaSemana":"LUNES","inicio":"14:00","fin":"19:00"}],"cierres":["2026-12-25"]}'
curl -X POST http://localhost:3000/api/barberias/<ID>/servicios -H "Content-Type: application/json" \
  -d '{"nombre":"Corte clásico","precio":25000,"duracionMinutos":30}'
curl -X PUT http://localhost:3000/api/barberias/<ID>/servicios/<SERVICIO> -H "Content-Type: application/json" \
  -d '{"nombre":"Corte clásico","precio":28000,"duracionMinutos":30}'
curl -X POST http://localhost:3000/api/barberias/<ID>/servicios/<SERVICIO>/desactivacion
curl http://localhost:3000/api/barberias/<ID>/servicios
curl "http://localhost:3000/api/barberias/<ID>/servicios?todos=true"
curl -X POST http://localhost:3000/api/barberias/<ID>/suspension
```

### Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Falta BD_SERVIDOR (copia .env.example a .env)` | No existe `.env` | `cp .env.example .env` y completar la contraseña |
| `Cannot find module './generado/client'` | El cliente no se ha generado | `npx prisma generate` |
| `Property 'x' does not exist on type 'PrismaClient'` o sobre un modelo | El cliente se generó antes de que el esquema cambiara (migrar no lo regenera) | `npx prisma generate` |
| `Failed to connect to localhost:1433` | SQL Server detenido o sin TCP/IP | Iniciar el servicio *SQL Server (SQLEXPRESS)*; en Configuration Manager habilitar TCP/IP con puerto 1433 en *IPAll* y reiniciar el servicio |
| `Login failed for user 'kronobarber'` | Autenticación mixta desactivada o clave errada | Activar *SQL Server and Windows Authentication mode* y reiniciar |
| `self signed certificate` | Certificado local autofirmado | `BD_CONFIAR_CERTIFICADO=true` |
| `migrate dev` falla con la base sombra | No existe `KronoBarber_sombra` o el login no es `db_owner` en ella | Repetir la preparación única |
| `npm run arquitectura` falla | Un archivo de `dominio/` o `aplicacion/` importa hacia afuera | La prueba lista los archivos culpables |

### Sin cliente web

**No habrá frontend** (decisión del 2026-09-30, confirmada el 2026-10-24): el proyecto es solo backend,
y su interfaz de demostración es Swagger UI en `/api/docs`. Con eso sale del alcance CAR-18. Lo que antes
eran reglas del cliente pasan a ser obligaciones de la API, para que quien la consuma (Swagger, Postman o
un cliente futuro) no tenga que deducir nada:

- **La API devuelve las reglas ya calculadas.** El anticipo, el saldo, la política de cancelación y los
  espacios libres salen del servidor; ningún consumidor debería reimplementarlos.
- **Los estados viajan explícitos.** El estado del turno o de la barbería es un campo de la respuesta, no
  algo que se infiera comparando fechas.
- **Ningún dato de tarjeta llega al servidor** (RES-13): el pago del anticipo se delega a la página de la
  pasarela y la API solo maneja la referencia de la transacción.
- **Los horarios se presentan en America/Bogotá** (DEP-02), convertidos en el borde HTTP.
- **Swagger es la interfaz**: cada ruta entra al contrato con ejemplos y con todos sus errores. Una ruta
  que no está en `/api/docs` no se puede demostrar.

### Dónde aterrizan los patrones

| Patrón | Dónde | Estado |
|---|---|---|
| **DAO / Repository** | `dominio/puertos`: `guardar`, `porId`, `activosDe`; nunca SQL | Implementado |
| **Adapter** | `BarberiaDAOPrisma`, `ServicioDAOPrisma`, `UsuarioDAOPrisma`, `HorarioAtencionDAOPrisma`; después `PasarelaPagosSandbox`, `NotificadorCorreo` | Implementado (persistencia) |
| **Strategy** | `PoliticaCancelacion`, `PoliticaAsignacionEspacios` | con la reserva |
| **State** | `Turno` + `EstadoTurno`: las transiciones inválidas se vuelven imposibles | con el turno |
| **Observer** | Eventos del turno que disparan notificaciones e historial | con la reserva |

### Cómo se hace cumplir la regla

`tests/arquitectura.test.ts` recorre `src/dominio/` y `src/aplicacion/` y falla si algún archivo importa
de `infraestructura/`, de `express` o de `@prisma/` (y, en el caso del dominio, de `aplicacion/`). Corre
con `npm test` y por separado con `npm run arquitectura`.

Está escrita como prueba, y no como un `grep` en `package.json`, porque en Windows npm ejecuta los
scripts con `cmd.exe`: así corre igual en Windows, Mac y en la integración continua.

---

## 9. Convenciones

- **Nombres en el idioma del negocio.** `ReservarTurno`, no `BookingService`. `LiberarReservasVencidas`,
  no `ReservationProcessor`.
- **Nada de `GestorX` ni `ServicioX` genéricos.** Un nombre que sirve para todo no describe nada.
- **Nada de `utils/` ni `helpers/`.** Son carpetas sin criterio de pertenencia: todo cabe y nada se
  encuentra. Si algo no tiene dónde ir, es que le falta un nombre.
- **Un archivo por concepto.** La entidad, su DTO y sus funciones puras viven juntos en
  `dominio/modelo/X.ts`; el caso de uso, su DTO de entrada y sus errores, en `casos-uso/VerboX.ts`
  (verbo en infinitivo). El único `index.ts` es `dominio/puertos/`.
- **No se crean capas vacías.** Una carpeta o un puerto entra cuando una historia de usuario lo necesita.
- **Pruebas junto con cada entidad**: `tests/unidad/` por entidad y un doble en memoria por DAO en
  `tests/dobles/`.
- **Imports relativos y sin extensión** (commonjs + nodenext). `import type` para todo lo que sea solo tipo.
- **`main.ts` es el único archivo que puede importarlo todo y hacer `new`.** Si un segundo empieza a
  hacerlo, hay un problema de diseño.
- **`process.env['X']` con corchetes** y guarda explícita: lo exige `noUncheckedIndexedAccess`.
- **Nulo explícito, no opcional**: `motivoSuspension: string | null`, no `motivoSuspension?: string`
  (`exactOptionalPropertyTypes`).
- **Los DAO devuelven `null` cuando no encuentran**; no lanzan. "No existe" es un resultado normal.
- **Ningún `new Date()` en `dominio/` ni en `aplicacion/`.** Hoy los instantes de auditoría (`creadoEn`) los
  pone la base de datos. Cuando una regla necesite "ahora" (el vencimiento de reservas), entra un puerto
  `Reloj` y su doble `RelojFijo`.
- **El dinero son pesos COP enteros**: `Int` en la base de datos, `number` entero en el dominio, validado
  con `esPrecioValido`. El 20 % y su redondeo vivirán en una sola función del dominio (regla 1).
- **Los instantes se persisten en UTC y se presentan en America/Bogotá.** La conversión ocurre en los
  bordes, no en el dominio. Las horas del horario de atención (`HH:MM`) no son instantes: son hora local
  de Bogotá, que no tiene horario de verano, y así se compararán con la jornada y los turnos.

---

## 10. Atributos de calidad (ISO/IEC 25010)

| Atributo | Compromiso |
|---|---|
| **Fiabilidad** | La liberación de reservas vencidas es **idempotente**: repetir la ejecución no cancela dos veces el mismo turno |
| **Mantenibilidad** | El dominio se prueba sin base de datos ni red; la suite unitaria corre en menos de un segundo |
| **Seguridad** | Autorización por rol **y por barbería** en cada operación; ningún dato personal ni de pago en bitácoras |
| **Usabilidad** | Sin frontend, es la de la API: consultar la agenda o cerrar un turno es una sola petición, y cada error dice qué corregir |
| **Portabilidad** | Cambiar el motor de persistencia o la pasarela no modifica una línea del dominio |
| **Eficiencia** | El cálculo de espacios libres responde de inmediato al abrir el calendario del barbero |

---

## 11. Proceso y entregas

- **Scrum**, sprints de duración fija, una entrega demostrable por corte académico (tres cortes en 2026-03).
- **GitFlow** (ramas abajo): ninguna entrega se acepta con la construcción en rojo. La integración continua
  todavía no está configurada (no hay `.github/workflows`), así que hoy esa verificación es local.
- Cada entrega compara el **esfuerzo estimado contra el esfuerzo real** medido.
- **Node.js + TypeScript con tipado estricto** en el servidor (plan de curso 103093). **Sin cliente
  web**: la entrega es la API (§8, *Sin cliente web*).
- Los cambios acordados **entran al backlog, no al sprint en curso**.
- **Un caso cerrado se reabre para corregirlo** (indicación del docente): no se crean casos nuevos para
  corregir. Al reabrirlo se agrega al final de su descripción una sección **Corrección** con los ajustes y
  sus criterios, sin borrar lo original, y el caso se cierra de nuevo cuando la corrección se fusiona.
  - Si el caso todavía no está publicado en `main`, se corrige en **su rama original** y vuelve a `develop`
    con un PR nuevo.
  - Si el defecto ya está publicado en `main`, se corrige con un **hotfix** desde `main`.
  - Un **caso nuevo** solo aparece para funcionalidad nueva que depende de trabajo pendiente, y cita el caso
    cerrado que modifica (por ejemplo, #75 sobre #8).
- Sin presupuesto: solo herramientas libres, gratuitas o de bajo costo (RES-09).

### Ramas

**`main` solo recibe PR de ramas `release`**, con una excepción: los hotfix. Las ramas de los casos salen
de `main` y se fusionan en `develop`, y `develop` llega a `main` a través de una `release`.

| Rama | Sale de | Se fusiona en | Nombre | Ejemplo |
|---|---|---|---|---|
| `main` | — | — | Solo recibe PR de `release` y de `hotfix` | — |
| `develop` | `main` | Una `release` | — | — |
| Caso del backlog | `main` | `develop`, por PR | `feature/fase-id-nombredescriptivodelcaso` | `feature/f1-21-create-dtos` |
| Corrección de un caso sin publicar | La **rama original** del caso, que ya existe | `develop`, por un PR nuevo | El de la rama original | `feature/F1-09-suspender-barberia` (#9, reabierto) |
| Release | `main` | `main`, por PR | `release/vX.Y.Z`, por versión | `release/v0.1.0` |
| Hotfix | `main` | `main`, directamente, por PR | `hotfix/fase-id-nombredescriptivodelcaso` | `hotfix/f1-09-…`, si corrige el caso #9 |

- **`fase`**: `f` en minúscula y el número de la fase (`f1`).
- **`id`**: el número del issue que se trabaja (`21`). En un hotfix es el del caso reabierto que corrige.
- **`nombredescriptivodelcaso`**: en minúsculas, sin tildes y separado por guiones (`create-dtos`).

Las ramas anteriores a esta nomenclatura (`feature/F1-09-suspender-barberia`, `feature/F1-10`…) conservan su
nombre: una corrección se hace en la rama tal como existe.

### Versiones

Las releases siguen el versionado semántico, `MAYOR.MENOR.PARCHE`:

- Mientras el producto está en desarrollo, la versión empieza en `0`: la API todavía puede cambiar.
- Cada release nueva sube el número menor: `v0.1.0`, `v0.2.0`, `v0.3.0`…
- Un hotfix sobre lo que ya está en `main` sube el parche: `v0.1.1`.
- `v1.0.0` se reserva para el producto completo, con la reserva con anticipo (fases 1 a 9) y la API estable.
- La `version` de `package.json` es la de la release, y se actualiza en la propia rama `release` o
  `hotfix`. El número va pegado a la `v`: `v0.1.0`, no `v.0.1.0`.

### Proceso para fusionar

**Un caso en `develop`**

1. Crear la rama `feature/…` desde `main` actualizado.
2. Antes de abrir el PR, fusionar `develop` en la rama y resolver ahí los conflictos, no en `develop`. Así
   se hizo en la Fase 1 («Fusiona develop en feature/F1-12 tras integrar F1-13»). Si el caso depende de
   algo que ya está en `develop` pero todavía no en `main` (por ejemplo, #18 necesita `RegistrarUsuario`,
   #24), esa fusión se hace también al empezar.
3. `npm test` y `npx tsc --noEmit` en verde.
4. Abrir el PR hacia `develop` citando el issue. GitHub solo cierra issues automáticamente al fusionar en la
   rama por defecto (`main`), así que el issue se cierra a mano, y solo cuando cumple todos sus criterios
   de aceptación.

**Una corrección de un caso ya integrado en `develop`** (todavía sin publicar)

1. Reabrir el caso y agregar al final de su descripción la sección **Corrección**.
2. Volver a la rama original del caso y traer lo último de ella (`git switch feature/F1-09-suspender-barberia`
   y `git pull`).
3. Fusionar `develop` en esa rama, para que tenga todo lo integrado después, y resolver ahí los
   conflictos.
4. Aplicar lo que dice la sección **Corrección**, con `npm test` y `npx tsc --noEmit` en verde.
5. Abrir un PR nuevo de la rama original hacia `develop`, citando el caso, y cerrarlo de nuevo a mano
   cuando cumpla los criterios de la corrección.

**Una entrega en `main`** (al cerrar un corte)

1. `develop` pasa todas las pruebas: `npm test`, `npx tsc --noEmit` y las pruebas manuales de cada
   endpoint contra SQL Server. Lo que falle se corrige antes de seguir, en la rama original del caso.
2. Crear la rama `release/vX.Y.Z` desde `main`, con la versión que toca según *Versiones*. La primera es
   `release/v0.1.0`.
3. Fusionar `develop` en la `release`.
4. Abrir el PR de la `release` hacia `main`. Es la única vía de `develop` a `main`. Los PR #54 a #58 se
   abrieron de casos directo a `main` y se cerraron.

**Un hotfix en `main`**

1. Reabrir el caso que tiene el defecto y agregar al final de su descripción la sección **Corrección**.
2. Crear la rama `hotfix/…` desde `main`, con el número de ese caso.
3. Corregir, con `npm test` y `npx tsc --noEmit` en verde.
4. Abrir el PR directamente hacia `main`, citando el caso, y cerrarlo de nuevo al fusionar.

No hace falta fusionar el hotfix en `develop`: como las ramas de los casos salen de `main`, la corrección
llega a `develop` con el siguiente PR de un caso.

---

## 12. Documentos de referencia del proyecto

| Documento | Contenido |
|---|---|
| `DocumentoDeVision-KronoBarber-V1.1.docx` | Fuente de verdad del alcance, los interesados, las características y las restricciones |
| `Idea_general_del_proyecto` | Descripción original de la que parte el producto |
| `documento-vision.md` | Plantilla y guía del curso para el documento de visión |

---

## 13. Estado actual y decisiones

Corte del **2026-10-24** sobre `develop` (`8087e4b`): 51 pruebas de Vitest en verde, `tsc` sin errores,
4 tablas (`Barberia`, `Servicio`, `Usuario`, `HorarioAtencion`), 8 casos de uso y 11 rutas de negocio.
Están integradas las fases 1 y 2 (PR #59 a #66): backlog de Barbería y Catálogo, y horario de atención. Lo
que hay por característica está en la columna **Estado** del §5. Los defectos de las fases 1 y 2 se
corrigen reabriendo sus casos, cada uno en su rama original, antes de la primera release,
`release/v0.1.0`: #13 ya está corregido; faltan #9, #10 y #12.

### Decisiones abiertas

Son de las fases 5 a 9 y **se retoman al terminar la Fase 4 completa** (acordado el 2026-10-24). La
propuesta es la recomendación de partida.

| Id | Pregunta | Bloquea | Propuesta |
|---|---|---|---|
| D-10 | ¿El cliente es un `Usuario` con rol `CLIENTE` o una entidad aparte? (#28) | Fase 5 | `Usuario` con rol `CLIENTE`, más un registro propio de la autorización de la Ley 1581 |
| D-11 | ¿Cuánto dura el plazo para pagar el anticipo y bloquea el espacio mientras tanto? | fases 6, 8 y 9 | Sí lo bloquea, con un plazo corto (por ejemplo, 15 minutos) en una constante del dominio |
| D-12 | ¿Qué política de cancelación y reprogramación? Incluye qué pasa con los turnos confirmados de una barbería que se suspende, o que pisa una ausencia. Ya está decidido que, si cancela la barbería, se devuelve el anticipo (D-17); falta **cómo**, porque las devoluciones automáticas están fuera del alcance (§6) | #45 a #47, regla 8 | Reprogramar con una anticipación mínima conserva el anticipo; cancelar tarde o no llegar lo pierde |
| D-13 | ¿Cómo se impide el solapamiento concurrente en SQL Server? (#31 pide documentarlo) | #31, CAR-13 | Transacción que bloquee la fila del barbero antes de verificar e insertar |
| D-14 | ¿Cómo se liberan las reservas vencidas? | #49, #50 | Que la disponibilidad ignore las vencidas y que una tarea periódica las cancele de forma idempotente |
| D-15 | ¿Qué proveedor de pasarela sandbox? El backlog ya fija el simulador con el mismo contrato, la selección por variable de entorno (#43) y solo bitácora en desarrollo (#48) | #43 | Construir primero el simulador y elegir el proveedor después |

### Decisiones tomadas

| Fecha | Decisión |
|---|---|
| 2026-09-10 | El backend se reestructura con los patrones de HelpDesk: entidades como `interface`, puertos `...DAO`, casos de uso con `ejecutar()`, Prisma 7 sobre SQL Server sin Docker |
| 2026-09-23 | Una sola entidad `Usuario` con `rol` y `barberiaId` (PR #6) |
| 2026-09-30 | No construir frontend; la entrega es la API |
| 2026-10-19 | Un barbero es un `Usuario` con rol `BARBERO`, y su cuenta la crea el administrador de su barbería (#17, #18) |
| 2026-10-24 | **D-01**: confirmado, **no habrá frontend**, solo backend. Sale CAR-18. El Documento de Visión v1.1 todavía la incluye: conviene reflejarlo en su próxima versión, junto con el cambio de perfil de CAR-06 (D-16) |
| 2026-10-24 | **D-02**: la suspensión exige **motivo** (de 10 a 500 caracteres) y solo se suspende una barbería **habilitada**. El motivo lo leen el operador y el administrador de esa barbería, nunca el público. Sin historial: al rehabilitar se borra |
| 2026-10-24 | **D-03**: una barbería **suspendida** no se ve ni recibe reservas hasta que el operador la rehabilite, pero **su administrador puede seguir editándola** (perfil, catálogo, horario y personal) para corregir lo que motivó la suspensión |
| 2026-10-24 | **D-04**: un servicio se activa y desactiva con `POST /barberias/:barberiaId/servicios/:id/desactivacion` y `.../activacion`, sin cuerpo: `404` si no es de esa barbería y `409` si ya estaba así, igual que habilitar y suspender. Inactivo **no se muestra** en la vitrina ni **se puede reservar**, pero **se puede editar** y sale en el catálogo de gestión. Los turnos reservados antes de desactivarlo siguen. Se retira el `PATCH /barberias/:id/estado` |
| 2026-10-24 | **D-05**: la **descripción** de un servicio **se puede editar** en `PUT .../servicios/:id`; si no viene en el cuerpo, se conserva |
| 2026-10-24 | **D-06**: el horario se consulta con `GET /barberias/:id/horario`: **público** si la barbería está habilitada; **su administrador** lo ve siempre |
| 2026-10-24 | **D-07**: **toda barbería la registra un administrador**, en **una sola petición** que crea la barbería y la cuenta de su administrador. No existen barberías sin dueño ni administradores sin barbería. Va como caso nuevo de la Fase 4 (#75), no como hotfix, porque depende de `ServicioClaves` (#22) |
| 2026-10-24 | **D-08**: el **operador** lo crea el equipo con un **script de semilla**; los **clientes se registran** solos por `POST /auth/registro`, que nunca deja elegir el rol. El administrador nace con su barbería (D-07) y el barbero lo crea su administrador |
| 2026-10-24 | **D-09**: la **sesión** de un usuario que inicia sesión dura **como máximo una hora**; vencida, vuelve a iniciar sesión. Una cuenta desactivada, como la de un **barbero desvinculado**, **pierde el acceso de inmediato**, aunque su sesión no haya vencido. La **clave** mide **al menos 10 caracteres** (y como máximo 64, porque bcrypt solo usa los primeros 72 bytes) |
| 2026-10-24 | **D-16**: la **jornada** la define el barbero, pero la registra y modifica **solo su administrador**. Lo mismo con los **días libres**, los **permisos** y los **bloqueos** (el tiempo en que no trabaja dentro de su jornada): los registra el administrador, **sin solicitudes ni aprobación**. El barbero se lo comunica fuera del sistema y no puede cambiarlos |
| 2026-10-24 | **D-17**: el administrador puede **desvincular** a un barbero (`activo = false`, nunca se borra). Pierde el acceso de inmediato, y sus **turnos futuros** se cancelan con la política de cancelación, como cancelación de la barbería: **se devuelve el anticipo al cliente** |
| 2026-10-24 | Las decisiones de las **fases 5 a 9** (D-10 a D-15) se toman **al terminar la Fase 4 completa** |

Reglas que ya fija el código de las fases 1 y 2, aunque no estén en el Documento de Visión:

- El catálogo y el horario se configuran en **cualquier estado** de la barbería: es parte de la puesta en
  marcha. RES-11 condiciona la visibilidad y las reservas, no la configuración. D-03 extiende esta regla
  al perfil.
- Habilitar una barbería ya habilitada es un error (`409`), no una operación vacía.
- El nombre de un servicio es único dentro de su barbería, sin distinguir mayúsculas.
- La duración de un servicio va de 5 a 480 minutos, en múltiplos de 5; el precio, de 1 a 100 000 000 COP.
- El horario de atención se reemplaza completo. Admite varias franjas por día (jornada partida) y franjas
  contiguas, pero no solapadas, y los cierres son fechas sin repetir.
