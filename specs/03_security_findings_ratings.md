# Security Findings: Sistema de Ratings

**Versión**: 1.0
**Fecha**: 2026-05-11
**Scope**: Endpoints de ratings implementados en `Backend/app/main.py` y `Backend/app/services/course_service.py`
**Contexto**: Revisión de seguridad post-implementación del plan `01_plan_backend_ratings.md`

---

## Resumen ejecutivo

Se identificaron 3 vulnerabilidades durante la revisión de seguridad del sistema de ratings.
Las 3 comparten la misma causa raíz: **ausencia de capa de autenticación en los endpoints de escritura**.
Este estado es esperado para un proyecto de aprendizaje donde la autenticación está marcada como feature pendiente.

| # | Severidad | Confianza | Categoría | Estado |
|---|-----------|-----------|-----------|--------|
| 1 | HIGH | 10/10 | authorization_bypass | Pendiente |
| 2 | MEDIUM | 9/10 | inconsistent_authorization | Pendiente |
| 3 | MEDIUM | 8/10 | data_integrity | Pendiente |

---

## Finding 1: IDOR — Mutación no autenticada del rating de cualquier usuario

**Archivo:** `Backend/app/main.py:105–118`
**Severidad:** HIGH
**Confianza:** 10/10
**Categoría:** `authorization_bypass`

### Descripción

`PUT /courses/{slug}/ratings/{user_id}` y `DELETE /courses/{slug}/ratings/{user_id}` aceptan `user_id` como parámetro de path sin ningún control de autenticación o autorización. Cualquier caller anónimo puede modificar o eliminar el rating de otro usuario sustituyendo su `user_id` en la URL.

### Escenario de explotación

```
DELETE /courses/curso-de-react/ratings/42
```
Sin credenciales, el rating del usuario 42 queda soft-deleted. El `PUT` equivalente permite sobrescribir el valor del rating de otro usuario.

### Recomendación

Agregar un `Depends()` que valide un bearer token y compruebe que el `user_id` autenticado coincide con el `user_id` del path antes de permitir la operación. Como mínimo, rechazar requests no autenticados con 401.

```python
# Ejemplo de guard futuro
def require_auth_user(
    user_id: int,
    token: str = Depends(oauth2_scheme)
) -> int:
    authenticated_id = decode_token(token)
    if authenticated_id != user_id:
        raise HTTPException(status_code=403)
    return authenticated_id
```

---

## Finding 2: `user_id` del body silenciosamente ignorado en PUT

**Archivo:** `Backend/app/main.py:106–110`
**Severidad:** MEDIUM
**Confianza:** 9/10
**Categoría:** `inconsistent_authorization`

### Descripción

El endpoint PUT acepta `body: RatingRequest` (que incluye `user_id`), lo valida con Pydantic, pero luego llama a `course_service.update_course_rating(slug, user_id, body.rating)` usando el `user_id` del **path** — descartando `body.user_id` en silencio. El campo del body se valida pero nunca se usa, generando inconsistencia.

### Recomendación

Dos opciones mutuamente excluyentes:

**Opción A (recomendada):** Eliminar `user_id` de `RatingRequest` para los endpoints de escritura. El `user_id` de escritura debe venir del path (o de la sesión autenticada), no del body.

**Opción B:** Agregar validación explícita:
```python
if body.user_id != user_id:
    raise HTTPException(status_code=422, detail="user_id mismatch")
```

---

## Finding 3: Acumulación ilimitada de filas soft-deleted via IDOR

**Archivo:** `Backend/app/services/course_service.py:122–137`
**Severidad:** MEDIUM
**Confianza:** 8/10
**Categoría:** `data_integrity`

### Descripción

La brecha TOCTOU en `add_course_rating` (check-then-act sin lock de DB) combinada con el IDOR del Finding 1 permite a un atacante:

1. Eliminar el rating activo de otro usuario (via Finding 1)
2. Hacer POST de un nuevo rating en su nombre
3. Repetir indefinidamente → filas soft-deleted ilimitadas para cualquier par `(course_id, user_id)`

El partial unique index solo previene duplicados en filas **activas** (`deleted_at IS NULL`), no acota el histórico de filas eliminadas.

### Recomendación

El partial unique index no puede solucionar esto sin autenticación. Fixing Finding 1 elimina el vector principal de explotación. Como hardening adicional post-autenticación: agregar un índice o trigger que limite las filas soft-deleted por `(course_id, user_id)`, o implementar hard delete para ratings eliminados.

---

## Causa raíz común

Los tres findings comparten la misma raíz: **los endpoints de escritura carecen de capa de autenticación**. `user_id` se toma directamente de la URL/body sin verificar identidad.

Al implementar autenticación (feature pendiente en `CLAUDE.md`), el `user_id` debe extraerse del token autenticado — nunca del request del cliente.

---

## Impacto en el roadmap

- Estos findings **no bloquean** la implementación del frontend (`02_plan_frontend_ratings.md`)
- Deben resolverse **antes** de exponer los endpoints en un entorno no local
- La autenticación es prerequisito para cerrar los tres findings simultáneamente

---

*Ver implementación en `01_plan_backend_ratings.md`. Arquitectura base en `00_sistema_ratings_cursos.md`.*
