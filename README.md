# TP - Sistema de Gestión Hospitalaria

Mini sistema hospitalario desarrollado como Trabajo Práctico de la Tecnicatura Universitaria en
Programación.

**Integrantes:** Martín Robledo, Ignacio Beltramino, Joaquín Mullasano y Joaquín Acosta.

| Módulo                                                                | Integrantes                        |
| --------------------------------------------------------------------- | ---------------------------------- |
| Gestión de Recursos y Camas, Inventario, Historia Clínica Electrónica | Martín Robledo                     |
| Atención y Enfermería                                                 | Ignacio Beltramino                 |
| Admisión y Turnos, Guardia, Identidad y Accesos (IAM)                 | Joaquín Mullasano                  |
| Facturación                                                           | Joaquín Acosta                     |

## Tecnologías

- **Backend:** NestJS 12, TypeORM, SQL Server, JWT (Passport), class-validator, Vitest
- **Frontend:** Vue 3 (Composition API), TypeScript, Vite, Vue Router, Pinia

## Estructura

```
backend/
  database/GestionHospital.sql   Script completo de la base (se ejecuta en SSMS)
  src/modules/
    iam/          Login, usuarios, roles y guards (@Auth)
    admision/     Turnos, entreturnos, lista de espera, horarios, guardia (triaje)
    hce/          Historia clínica, evoluciones (inmutables) y estudios
    enfermeria/   Signos vitales, medicación, alertas y protocolos (Builder)
    camas/        Mapa de camas y su máquina de estados
    inventario/   Insumos médicos y stock
    facturacion/  Cuentas de estadía, cargos y coberturas (Strategy)
frontend/
  src/views/      Una vista por módulo
  src/modules/enfermeria/
  src/components/ Componentes compartidos (datos del paciente, lista de espera)
```

## Cómo levantar el proyecto

### 1. Base de datos

1. Tener SQL Server (Express alcanza) con autenticación de SQL Server y TCP/IP habilitados.
2. Abrir `backend/database/GestionHospital.sql` en SQL Server Management Studio y ejecutarlo (F5).
   > ⚠️ El script **borra y vuelve a crear** la base `GestionHospital`. Hacé un backup si tenés datos.

Crea todas las tablas y carga datos de prueba: roles, coberturas, 3 pacientes (Juan Gómez,
Ana Rojas, Carlos López), especialidades, camas e insumos.

### 2. Backend

```bash
cd backend
copy .env.example .env      # en Linux/Mac: cp .env.example .env
npm install
npm run start:dev
```

Completar el `.env` con los datos de **tu** SQL Server. El `.env` no se sube al repositorio.

| Variable                        | Qué es                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Servidor, puerto y base (por defecto `localhost`, `1433`, `GestionHospital`)                                              |
| `DB_USER`, `DB_PASSWORD`        | Usuario y contraseña de SQL Server                                                                                        |
| `JWT_SECRET`                    | Clave para firmar los tokens. Generar una con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

El backend queda en `http://localhost:3000`. No modifica el esquema de la base
(`synchronize: false`): cualquier cambio de tablas va en el script SQL.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Queda en `http://localhost:5173`.

### 4. Primer ingreso

- **Usuario:** `admin@hospital.com`
- **Contraseña:** `Admin123!`
  Desde **Usuarios** se crean las cuentas del resto de los roles. Para que un médico vea su agenda,
  en **Profesionales** hay que crear el profesional y vincularlo a su cuenta.

## Roles y permisos

El administrador accede a todo. Los permisos se validan en el backend con `@Auth(...)`; el frontend
solo esconde las vistas y los botones que cada rol no puede usar.

| Vista                    |       Recepcionista       |     Médico      |      Enfermero       | Maestranza  |
| ------------------------ | :-----------------------: | :-------------: | :------------------: | :---------: |
| Admisión y Profesionales |            ✅             |                 |                      |             |
| Facturación              |            ✅             |                 |                      |             |
| Mi Agenda                |                           |       ✅        |                      |             |
| Guardia                  |                           |       ✅        |          ✅          |             |
| Camas                    | ✅ asigna, alta, traslado |       👁️        |          👁️          | ✅ limpieza |
| Inventario               |                           |       👁️        |          👁️          |             |
| Historia Clínica         |                           |       ✅        |          👁️          |             |
| Enfermería               |                           | ✅ indicaciones | ✅ controles y dosis |             |

✅ usa y modifica · 👁️ solo consulta

Quien firma una evolución, una indicación, una dosis o un control de signos vitales **sale del
token del usuario logueado**, nunca del formulario: así no se puede registrar a nombre de otro.

## Historias de usuario y patrones

| Módulo      | HU                       | Cómo se resolvió                                                                                                                                            |
| ----------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admisión    | 1.1 Reserva segura       | Transacción con bloqueo pesimista sobre el profesional: dos reservas simultáneas, solo entra la primera                                                     |
|             | 1.2 Entreturno           | Recorta el turno en curso y crea el entreturno en el tramo liberado; el turno recortado muestra "Tiempo reducido"                                           |
|             | 1.3 Lista de espera      | Al cancelar un turno, en **la misma transacción** se le asigna el horario al primero de la lista de ese profesional y ese día; la recepción recibe un aviso |
|             | 2.1 Estados del turno    | **Patrón State** (`estados-turnos.ts`): un turno cancelado no puede avanzar                                                                                 |
|             | 3.1 Triaje               | Cola ordenada por nivel de urgencia y hora de llegada; alerta de Código Rojo                                                                                |
| Enfermería  | 1.1 Signos vitales       | Nota automática; temperatura > 39 °C genera alerta y notificación al médico                                                                                 |
|             | 1.2 Medicación           | Margen de ±30 min; descuenta stock y emite el evento `MedicacionAdministrada`                                                                               |
|             | 2.1 Protocolos           | **Patrón Builder** (`protocol-builders.ts`): pre-quirúrgico y respiratorio                                                                                  |
| Camas       | 1.1 Asignación segura    | Bloqueo y validación del estado previo dentro de una transacción                                                                                            |
|             | 2.1 Higiene              | Máquina de estados (`cama-state.ts`): el alta pasa a "en limpieza", nunca directo a libre; cambios en tiempo real con Server-Sent Events                    |
| Inventario  | 3.1 Descuento de stock   | Descuento atómico al administrar una dosis                                                                                                                  |
| Facturación | 1.1 Costos por cobertura | **Patrón Strategy** (`facturacion-strategy.ts`): pública, prepaga y particular                                                                              |
|             | 2.1 Cargo automático     | Escucha el evento `MedicacionAdministrada` de forma asíncrona; cada cargo guarda el ID del evento y el mismo evento no se cobra dos veces                   |

## Decisiones de diseño

- **El paciente se identifica por DNI** (`Pacientes.Documento` es único). Al reservar un turno, si
  el DNI ya existe se usa ese paciente; si no, se registra.
- **El stock se descuenta en la misma transacción que registra la dosis**, no con un evento
  aparte: así no se puede registrar una dosis administrada sin stock. Facturación sí se entera por
  evento, porque un cargo puede procesarse después sin afectar la atención.
- **La lista de espera es por profesional y por día**, como pide la HU ("ese mismo día"): un turno
  liberado no se asigna a alguien que esperaba para otra fecha.
- **El monitor de camas en tiempo real (`GET /camas/eventos`) no exige token**: el `EventSource`
  del navegador no puede mandar el header `Authorization`. Solo publica número y estado de cama,
  sin datos del paciente.
- **Maestranza no ve qué paciente ocupa cada cama**: no lo necesita para su tarea.
- **Las evoluciones médicas son inmutables**: un trigger en la base impide modificarlas o borrarlas.

## Tests

```bash
cd backend
npm test
```

Tests unitarios de los patrones del TP (no necesitan base de datos):

- `facturacion-strategy.spec.ts`: los escenarios de la HU 1.1 de Facturación
- `estados-turnos.spec.ts`: transiciones válidas e inválidas del turno y permisos por rol
- `cama-state.spec.ts`: ciclo de vida de una cama
