import { apiRequest } from '../../auth/api';

// Entrada mínima del catálogo institucional que usan los selectores.
export interface CatalogoCarrera {
  car_codigo: string;
  nombre: string;
}

interface RespuestaAmbitosCatalogo {
  carreras?: CatalogoCarrera[];
}

// Códigos oficiales de carrera desde el catálogo institucional (GET /api/ambitos).
// Los selectores de la Autoridad son estáticos: este catálogo solo los enriquece
// con el código real; cualquier error se degrada a opciones sin código.
export function obtenerCatalogoCarreras(): Promise<CatalogoCarrera[]> {
  return apiRequest<RespuestaAmbitosCatalogo>('/api/ambitos')
    .then((catalogo) => catalogo.carreras ?? []);
}