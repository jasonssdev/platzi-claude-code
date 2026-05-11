# Platziflix — CLAUDE.md

Proyecto de aprendizaje del curso de Claude Code en Platzi. Plataforma de cursos online con cuatro sub-proyectos que comparten una misma API REST.

## Estructura del monorepo

```
platzi-claude-code/
├── Backend/     # FastAPI + PostgreSQL
├── Frontend/    # Next.js 15 (web)
└── Mobile/
    ├── PlatziFlixiOS/      # SwiftUI (iOS nativo)
    └── PlatziFlixAndroid/  # Jetpack Compose (Android nativo)
```

---

## Backend

**Stack:** Python 3.11, FastAPI 0.104+, SQLAlchemy 2.0, Alembic, PostgreSQL 15, UV, Docker

**Arrancar el entorno:**
```bash
cd Backend
docker-compose up          # Levanta API (:8000) + PostgreSQL (:5432)
make migrate               # Aplica migraciones pendientes
make seed                  # Inserta datos de prueba
make seed-fresh            # Limpia y re-inserta datos
```

**Estructura:**
```
app/
├── main.py                # Instancia FastAPI y rutas HTTP
├── core/config.py         # Settings via pydantic-settings (.env)
├── db/
│   ├── base.py            # Engine, SessionLocal, get_db()
│   └── seed.py            # Datos de prueba
├── models/                # ORM: Course, Teacher, Lesson, CourseTeachers, BaseModel
├── services/
│   └── course_service.py  # Toda la lógica de negocio
├── alembic/               # Migraciones (env.py + versions/)
└── test_main.py           # Tests con pytest + TestClient
specs/
├── 00_contracts.md        # Contratos de la API (fuente de verdad)
└── 01_setup.md            # Instrucciones de setup
```

**Endpoints implementados:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Bienvenida |
| GET | `/health` | Health check + estado de DB |
| GET | `/courses` | Lista de cursos (sin deleted_at) |
| GET | `/courses/{slug}` | Detalle de curso + clases |

**Endpoint pendiente (contrato definido, no implementado):**
- `GET /courses/{slug}/classes/{id}` — detalle de clase individual

**Modelos de datos:**
- `Course`: id, name, description, thumbnail, slug — many-to-many con Teacher, one-to-many con Lesson
- `Teacher`: id, name, email (único)
- `Lesson`: id, course_id, name, description, slug, video_url
- `CourseTeachers`: tabla de asociación (course_id, teacher_id)
- Todos los modelos heredan de `BaseModel`: id, created_at, updated_at, deleted_at (soft delete)

**Patrones clave:**
- Soft delete: todos los queries filtran `WHERE deleted_at IS NULL`
- Dependency injection: `CourseService` se inyecta via `Depends(get_course_service)`
- Configuración 100% desde variables de entorno (DATABASE_URL, etc.)
- Tests con mocks via `app.dependency_overrides`

**Credenciales de DB (desarrollo):**
- User: `platziflix_user` / Password: `platziflix_password` / DB: `platziflix_db`

---

## Frontend

**Stack:** Next.js 15.3 (App Router), React 19, TypeScript, SCSS Modules, Vitest + React Testing Library

**Arrancar:**
```bash
cd Frontend
yarn dev    # :3000 con Turbopack
yarn test   # Vitest
yarn build
```

**Estructura:**
```
src/
├── app/
│   ├── layout.tsx                       # Root layout (lang=es, fuentes, estilos globales)
│   ├── page.tsx                         # / — lista de cursos
│   ├── course/[slug]/
│   │   ├── page.tsx                     # /course/:slug — detalle de curso
│   │   ├── error.tsx                    # Error boundary (único Client Component)
│   │   ├── loading.tsx                  # Loading state
│   │   └── not-found.tsx               # 404
│   └── classes/[class_id]/
│       └── page.tsx                     # /classes/:id — video player
├── components/
│   ├── Course/          # Tarjeta de curso (Course.tsx + Course.module.scss)
│   ├── CourseDetail/    # Vista detalle con lista de clases
│   └── VideoPlayer/     # Player HTML5
├── styles/
│   ├── vars.scss        # Tokens de color (mapa SCSS, color('primary') = #ff2d2d)
│   └── reset.scss       # CSS reset
└── types/index.ts       # Tipos centralizados: Course, Class, CourseDetail, Quiz, Progress, FavoriteToggle
```

**Patrones clave:**
- Fetch en Server Components con `cache: "no-store"` hacia `http://localhost:8000`
- Sin estado cliente global (no Redux, no Zustand, no Context)
- `notFound()` para 404s en server, error boundary para errores en cliente
- SCSS Modules co-localizados con cada componente
- `generateMetadata()` para SEO dinámico por página

**Tipos con stub (no implementados en backend aún):** `Quiz`, `Progress`, `FavoriteToggle`

---

## Mobile

Dos apps nativas que consumen la misma API. Ambas siguen **Clean Architecture en 3 capas** con patrón MVVM.

```
Presentation  →  Domain  →  Data
(VM + UI)        (Models     (Repos + DTOs
                  + Protocols)  + Network)
```

### iOS — PlatziFlixiOS

**Stack:** Swift, SwiftUI, URLSession, Combine, Xcode

**Estructura:**
```
PlatziFlixiOS/
├── Services/          # NetworkManager, NetworkService protocol, APIEndpoint, HTTPMethod, NetworkError
├── Data/
│   ├── Entities/      # DTOs: CourseDTO, TeacherDTO, ClassDetailDTO (Codable)
│   ├── Mapper/        # CourseMapper, ClassMapper, TeacherMapper
│   └── Repositories/  # RemoteCourseRepository, CourseAPIEndpoints
├── Domain/
│   ├── Models/        # Course, Teacher, Class (domain puro, Identifiable + Equatable)
│   └── Repositories/  # CourseRepositoryProtocol
└── Presentation/
    ├── ViewModels/    # CourseListViewModel (@MainActor, Combine, debounce 300ms)
    └── Views/         # CourseListView, CourseCardView, DesignSystem
```

**Patrones clave:**
- DI via protocol injection (sin framework externo)
- `@MainActor` en ViewModel para actualizaciones de UI thread-safe
- Búsqueda local con debounce de 300ms via Combine
- `NetworkError` enum para manejo de errores tipado
- Soporte para previews SwiftUI con mock data en los modelos

**Pantallas implementadas:** Solo lista de cursos. Detalle tiene TODO.

### Android — PlatziFlixAndroid

**Stack:** Kotlin, Jetpack Compose, Retrofit 2.9, OkHttp, Gson, Coroutines, StateFlow, Coil

**Estructura:**
```
com.espaciotiago.platziflixandroid/
├── di/AppModule.kt              # Service locator (sin Hilt). USE_MOCK_DATA flag
├── data/
│   ├── network/                 # ApiService (Retrofit @GET), NetworkModule (BASE_URL, timeouts)
│   ├── entities/CourseDTO.kt    # @SerializedName + Gson
│   ├── mappers/CourseMapper.kt  # DTO → Domain
│   └── repositories/           # RemoteCourseRepository, MockCourseRepository
├── domain/
│   ├── models/Course.kt         # Data class
│   └── repositories/CourseRepository.kt  # Interface: suspend fun getAllCourses(): Result<List<Course>>
└── presentation/courses/
    ├── screen/CourseListScreen.kt    # Composable principal (Scaffold + LargeTopAppBar)
    ├── viewmodel/CourseListViewModel.kt  # StateFlow, viewModelScope, maneja UiEvents
    ├── state/CourseListUiState.kt    # Estado inmutable + UiEvent sealed class (MVI)
    └── components/               # CourseCard, ErrorMessage, LoadingIndicator
```

**Patrones clave:**
- MVI: `CourseListUiEvent` sealed class, estado inmutable con `.copy()`
- `Result<T>` para manejo de errores sin excepciones en capas de domain/data
- `withContext(Dispatchers.IO)` para llamadas de red
- `AppModule.USE_MOCK_DATA = true` para desarrollo sin backend
- Base URL del emulador: `http://10.0.2.2:8000/` (apunta al localhost del host)
- `network_security_config.xml` permite HTTP en desarrollo

**Pantallas implementadas:** Solo lista de cursos. Detalle tiene TODO.

---

## Contrato compartido de la API

Todos los clientes consumen los mismos endpoints. La fuente de verdad es `Backend/specs/00_contracts.md`.

**Respuesta de `/courses`:**
```json
[
  {
    "id": 1,
    "name": "Curso de React",
    "description": "...",
    "thumbnail": "https://...",
    "slug": "curso-de-react"
  }
]
```

**Respuesta de `/courses/{slug}`:**
```json
{
  "id": 1,
  "name": "Curso de React",
  "slug": "curso-de-react",
  "teacher_id": [1, 2],
  "classes": [
    { "id": 1, "name": "Intro", "description": "...", "slug": "intro" }
  ]
}
```

---

## Features pendientes (en todos los clientes)

- Navegación a detalle de curso en iOS y Android (TODOs en código)
- Endpoint `GET /courses/{slug}/classes/{id}` en backend
- Autenticación (ningún cliente la tiene)
- Quiz, Progress tracking, Favorites (tipos definidos en Frontend, sin backend)
- Búsqueda en Android (iOS ya la tiene)
- Paginación

---

## Convenciones del proyecto

- Idioma del UI: **español**
- Idioma del código (variables, funciones, commits): **inglés**
- Soft delete en backend: nunca borrar físicamente, usar `deleted_at`
- Tests con mocks de dependencias, no de DB real (backend usa `dependency_overrides`)
- Cada sub-proyecto es independiente; no hay código compartido entre ellos
