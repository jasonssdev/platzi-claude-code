# Plan de Implementación Backend: Sistema de Ratings

**Versión**: 1.1
**Fecha**: 2026-05-11
**Basado en**: `00_sistema_ratings_cursos.md` (análisis arquitectural)
**Alcance**: Backend — FastAPI + SQLAlchemy + PostgreSQL

---

## Orden de ejecución

```
B1 (modelo + migración)
  └── B2 (capa de servicio)
        └── B3 (endpoints + schemas)
              └── B4 (tests)
```

---

## Fase B1: Modelo y migración — 30 min

**Archivos a crear/modificar:**

- `Backend/app/models/course_rating.py` — nuevo modelo `CourseRating` heredando de `BaseModel`
- `Backend/app/models/base.py` — importar `CourseRating` para que Alembic lo detecte
- `Backend/app/models/course.py` — agregar relationship `ratings` hacia `CourseRating`
- `Backend/app/alembic/versions/<timestamp>_add_course_ratings_table.py` — migración autogenerada

**Checklist:**

- [x] Crear `Backend/app/models/course_rating.py` con modelo `CourseRating` heredando de `BaseModel`
- [x] Agregar `CheckConstraint('rating >= 1 AND rating <= 5')` en el campo `rating`
- [x] Agregar índices regulares en `course_id` y `user_id` en `__table_args__`
- [x] Agregar partial unique index `WHERE deleted_at IS NULL` en `(course_id, user_id)` en `__table_args__` — no usar UNIQUE constraint normal porque `NULL != NULL` en PostgreSQL
- [x] Importar `CourseRating` en `Backend/app/models/__init__.py` junto al resto de modelos
- [x] Agregar `ratings = relationship("CourseRating", back_populates="course", cascade="save-update, merge")` en `Backend/app/models/course.py` — sin `delete-orphan`, el soft delete se maneja via `deleted_at`
- [x] Ejecutar migración con mensaje `"add_course_ratings_table"` y revisar el archivo generado
- [x] Ejecutar `make migrate` y verificar que corre sin errores
- [x] Verificar en psql que la tabla `course_ratings` existe con el partial unique index

**Criterio de completitud:** `make migrate` sin errores; tabla `course_ratings` visible con el partial unique index; modelos importan sin errores de Python.

---

## Fase B2: Capa de servicio — 45 min

**Archivos a modificar:**

- `Backend/app/services/course_service.py` — agregar cinco métodos nuevos al `CourseService` existente

**Checklist:**

- [x] Agregar imports de `CourseRating`, `func` de SQLAlchemy y `datetime` en `course_service.py`
- [x] Implementar `get_course_rating_stats(slug)`: resolver `course_id` por slug, calcular promedio y total con `func.avg` + `func.count` filtrando `deleted_at IS NULL`; retornar `average_rating` (redondeado 1 decimal, `0.0` si sin ratings) y `total_ratings`
- [x] Implementar `get_user_course_rating(slug, user_id)`: query por `course_id` + `user_id` + `deleted_at IS NULL`; retornar objeto o `None`
- [x] Implementar `add_course_rating(slug, user_id, rating)`: verificar curso existe (404 si no), verificar no existe rating activo via `get_user_course_rating` (409 si existe), crear y persistir `CourseRating`
- [x] Implementar `update_course_rating(slug, user_id, rating)`: obtener rating activo (404 si no existe), actualizar `rating` y `updated_at`, persistir
- [x] Implementar `delete_course_rating(slug, user_id)`: obtener rating activo (404 si no existe), setear `deleted_at = datetime.utcnow()`, persistir

**Criterio de completitud:** los cinco métodos se pueden invocar sin errores; los casos 404 y 409 se comportan correctamente.

---

## Fase B3: Endpoints y schemas Pydantic — 30 min

**Archivos a modificar:**

- `Backend/app/main.py` — agregar schema `RatingRequest` y cuatro endpoints nuevos

**Checklist:**

- [x] Definir `RatingRequest` como Pydantic model con `user_id: int = Field(gt=0)` y `rating: int = Field(ge=1, le=5)`
- [x] Agregar `GET /courses/{slug}/ratings` — retorna stats agregados (200)
- [x] Agregar `POST /courses/{slug}/ratings` — crea rating (201); propaga 404 y 409 del servicio
- [x] Agregar `PUT /courses/{slug}/ratings/{user_id}` — actualiza rating (200); propaga 404
- [x] Agregar `DELETE /courses/{slug}/ratings/{user_id}` — soft delete (204 No Content); propaga 404
- [x] Verificar que los cuatro endpoints aparecen en `http://localhost:8000/docs`
- [x] Probar validación Pydantic con valor inválido (debe retornar 422)

**Criterio de completitud:** los cuatro endpoints responden correctamente via Swagger; validación Pydantic retorna 422 para valores fuera de rango.

---

## Fase B4: Tests — 45 min

**Archivos a modificar:**

- `Backend/app/test_main.py` — agregar tests para los cuatro endpoints nuevos, siguiendo el patrón `dependency_overrides` + AAA ya establecido

**Checklist:**

- [x] Crear mock de `CourseService` con los cinco métodos nuevos como stubs en `test_main.py`
- [x] Test `GET /courses/{slug}/ratings` → 200 con `average_rating` y `total_ratings`
- [x] Test `POST /courses/{slug}/ratings` → 201 (caso feliz)
- [x] Test `POST /courses/{slug}/ratings` → 404 (curso inexistente)
- [x] Test `POST /courses/{slug}/ratings` → 409 (rating duplicado activo)
- [x] Test `POST /courses/{slug}/ratings` → 422 (rating fuera de rango 1-5)
- [x] Test `PUT /courses/{slug}/ratings/{user_id}` → 200 (caso feliz)
- [x] Test `PUT /courses/{slug}/ratings/{user_id}` → 404 (rating inexistente)
- [x] Test `PUT /courses/{slug}/ratings/{user_id}` → 422 (valor inválido)
- [x] Test `DELETE /courses/{slug}/ratings/{user_id}` → 204 (caso feliz)
- [x] Test `DELETE /courses/{slug}/ratings/{user_id}` → 404 (rating inexistente)
- [x] Ejecutar `make test` y verificar que todos los tests pasan sin tocar la DB real

**Criterio de completitud:** `make test` sin fallos; ningún test toca la base de datos real (todo via `dependency_overrides`).

---

## Resumen

| Fase | Descripción | Estimación |
|------|-------------|------------|
| B1 | Modelo `CourseRating` + migración Alembic | 30 min |
| B2 | Cinco métodos en `CourseService` | 45 min |
| B3 | Cuatro endpoints en `main.py` + schema Pydantic | 30 min |
| B4 | Tests con `dependency_overrides` | 45 min |
| **TOTAL** | | **~2.5 horas** |

---

*Ver análisis arquitectural completo en `00_sistema_ratings_cursos.md`. Plan frontend en `02_plan_frontend_ratings.md`.*
