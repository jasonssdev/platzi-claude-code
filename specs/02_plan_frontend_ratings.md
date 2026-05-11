# Plan de Implementación Frontend: Sistema de Ratings

**Versión**: 1.1
**Fecha**: 2026-05-11
**Basado en**: `00_sistema_ratings_cursos.md` (análisis arquitectural)
**Alcance**: Frontend — Next.js 15, React, TypeScript, SCSS Modules, Vitest

---

## Orden de ejecución

```
F1 (tipos + api service)
  └── F2 (StarRating component)
        └── F3 (RatingWidget + integración CourseDetail)
              └── F4 (Course card + tests)
```

F1 puede iniciarse en paralelo con el backend desde el primer día.
F3 requiere que el backend tenga B3 desplegado o usar fetch contra un mock local.

---

## Fase F1: Tipos y servicio de API — 30 min

**Archivos a crear/modificar:**

- `Frontend/src/types/index.ts` — agregar `CourseRating`, `RatingRequest` y extender `Course`
- `Frontend/src/services/api.ts` — nuevo archivo centralizado con las funciones de ratings

**Checklist:**

- [ ] Agregar interfaz `CourseRating` (id, courseId, userId, rating, createdAt, updatedAt) en `types/index.ts`
- [ ] Agregar interfaz `RatingRequest` (userId, rating) en `types/index.ts`
- [ ] Extender interfaz `Course` con `averageRating?: number` y `totalRatings?: number` — opcionales para no romper consumidores actuales
- [ ] Crear `Frontend/src/services/api.ts` con constante `API_URL = 'http://localhost:8000'`
- [ ] Implementar `ratingsApi.getCourseRatings(slug)` — `GET /courses/{slug}/ratings`
- [ ] Implementar `ratingsApi.addCourseRating(slug, data)` — `POST /courses/{slug}/ratings`
- [ ] Implementar `ratingsApi.updateCourseRating(slug, userId, data)` — `PUT /courses/{slug}/ratings/{userId}`
- [ ] Implementar `ratingsApi.deleteCourseRating(slug, userId)` — `DELETE /courses/{slug}/ratings/{userId}`
- [ ] Implementar `fetchCourseRatingStats(slug)` como función nombrada exportada con `cache: "no-store"` para uso en Server Components
- [ ] Verificar `yarn build` sin errores de TypeScript

**Criterio de completitud:** `yarn build` compila sin errores; tipos importables desde cualquier componente sin conflictos.

---

## Fase F2: Componente StarRating — 45 min

**Archivos a crear:**

- `Frontend/src/components/StarRating/StarRating.tsx` — Client Component, soporta modo readonly e interactivo
- `Frontend/src/components/StarRating/StarRating.module.scss` — estilos co-localizados usando `color()` de `vars.scss`

**Checklist:**

- [ ] Crear directorio `Frontend/src/components/StarRating/`
- [ ] Crear `StarRating.tsx` con `'use client'`
- [ ] Definir props: `rating`, `onRatingChange?`, `readonly?`, `size?` (`small | medium | large`), `showCount?`, `totalRatings?`
- [ ] Agregar `useState` para `hoveredRating` — activo solo cuando `onRatingChange` está definido y `readonly` es falsy
- [ ] Renderizar 5 estrellas como `<button>` en modo interactivo o `<span>` en modo readonly
- [ ] Agregar `role="radiogroup"` en el contenedor
- [ ] Agregar `aria-label` y `aria-checked` en cada estrella
- [ ] Agregar soporte de `onKeyDown` para navegación con flechas izquierda/derecha
- [ ] Mostrar conteo de ratings junto a las estrellas cuando `showCount` y `totalRatings` están presentes
- [ ] Crear `StarRating.module.scss` con clases `.star`, `.starFilled`, `.starHovered`, `.container`, `.count`
- [ ] Usar `color()` de `vars.scss` para tokens de color — no hardcodear colores
- [ ] Aplicar `cursor: pointer` solo en modo interactivo
- [ ] Verificar `yarn build` sin errores

**Criterio de completitud:** el componente renderiza en modo readonly (sin eventos) y en modo interactivo (hover y click funcionan); `yarn build` limpio.

---

## Fase F3: RatingWidget e integración en CourseDetail — 45 min

**Archivos a crear/modificar:**

- `Frontend/src/components/RatingWidget/RatingWidget.tsx` — Client Component con estado y llamadas a la API
- `Frontend/src/components/RatingWidget/RatingWidget.module.scss` — estilos del widget
- `Frontend/src/app/course/[slug]/page.tsx` — agregar fetch de stats y renderizar `StarRating` readonly + `RatingWidget`

**Checklist:**

- [ ] Crear directorio `Frontend/src/components/RatingWidget/`
- [ ] Crear `RatingWidget.tsx` con `'use client'`; recibir props: `courseSlug`, `userId?`
- [ ] Agregar `useState` para `userRating`, `isLoading` y `error`
- [ ] Implementar handler de submit que llama a `ratingsApi.addCourseRating(courseSlug, { userId, rating })` y actualiza estado local al resolver
- [ ] Renderizar `StarRating` en modo interactivo dentro de `RatingWidget`, pasando `onRatingChange` y `userRating`
- [ ] Mostrar indicador de carga cuando `isLoading` es `true`
- [ ] Mostrar mensaje de error cuando `error` tiene valor
- [ ] Crear `RatingWidget.module.scss`
- [ ] Leer `Frontend/src/app/course/[slug]/page.tsx` antes de modificarlo para entender la estructura actual
- [ ] Agregar `fetchCourseRatingStats(slug)` en paralelo con el fetch existente de detalle del curso
- [ ] Renderizar `StarRating` en modo readonly con `stats.average_rating` y `stats.total_ratings` — no necesita estado cliente
- [ ] Renderizar `<RatingWidget courseSlug={slug} />` como Client Component separado debajo del detalle
- [ ] Verificar `yarn build` sin errores de tipos ni errores de hidratación SSR

**Criterio de completitud:** la página de detalle muestra el promedio del curso con estrellas; el widget permite calificar y llama al endpoint; `yarn build` limpio.

---

## Fase F4: StarRating en Course card y tests — 30 min

**Archivos a crear/modificar:**

- `Frontend/src/components/Course/Course.tsx` — agregar `StarRating` readonly con el promedio del curso
- `Frontend/src/components/StarRating/StarRating.test.tsx` — tests unitarios con Vitest + React Testing Library
- `Frontend/src/components/RatingWidget/RatingWidget.test.tsx` — tests del widget con mock de `fetch`

**Checklist:**

- [ ] Leer `Frontend/src/components/Course/Course.tsx` antes de modificar para entender props actuales
- [ ] Agregar `StarRating` readonly en `Course.tsx` usando `course.averageRating` y `course.totalRatings`
- [ ] Renderizar `StarRating` condicionalmente — solo cuando `averageRating` tiene valor
- [ ] Crear `Frontend/src/components/StarRating/StarRating.test.tsx`
- [ ] Test: renderiza 5 estrellas
- [ ] Test: en modo readonly no dispara `onRatingChange` al hacer click
- [ ] Test: en modo interactivo el click llama al callback con el valor correcto
- [ ] Test: etiquetas ARIA presentes en el contenedor y cada estrella
- [ ] Crear `Frontend/src/components/RatingWidget/RatingWidget.test.tsx`
- [ ] Test: mockear `fetch` con `vi.fn()` — el submit llama a la API con los datos correctos
- [ ] Test: muestra indicador de carga durante el POST
- [ ] Test: muestra mensaje de error cuando la API falla
- [ ] Ejecutar `yarn test` y corregir cualquier fallo
- [ ] Ejecutar `yarn build` y `yarn lint` — ambos limpios

**Criterio de completitud:** `yarn test` pasa todos los tests nuevos y existentes; `yarn build` y `yarn lint` limpios.

---

## Resumen

| Fase | Descripción | Estimación |
|------|-------------|------------|
| F1 | Tipos en `types/index.ts` + `services/api.ts` nuevo | 30 min |
| F2 | Componente `StarRating` (readonly + interactivo + ARIA) | 45 min |
| F3 | `RatingWidget` + integración en `course/[slug]/page.tsx` | 45 min |
| F4 | `StarRating` en `Course` card + tests Vitest | 30 min |
| **TOTAL** | | **~2.5 horas** |

---

*Ver análisis arquitectural completo en `00_sistema_ratings_cursos.md`. Plan backend en `01_plan_backend_ratings.md`.*
