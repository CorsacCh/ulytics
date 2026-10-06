export const datosInstitucionales: Record<string, string[]> = {
  'Facultad de Arquitectura y Artes': [
    'Arquitectura',
    'Artes Musicales y Sonoras',
    'Creación Audiovisual',
    'Diseño',
    'Licenciatura en Artes Visuales',
    'Interpretación Musical (Conservatorio de Música)'
  ],
  'Facultad de Ciencias': [
    'Biología',
    'Biología Marina',
    'Bioquímica',
    'Geografía',
    'Geología',
    'Licenciatura en Ciencias con Mención (Física, Matemática, Química, Biología)',
    'Química',
    'Química y Farmacia'
  ],
  'Facultad de Ciencias Agrarias': [
    'Agronomía',
    'Ingeniería en Alimentos'
  ],
  'Facultad de Ciencias Económicas y Administrativas': [
    'Administración de Empresas de Turismo',
    'Administración Pública',
    'Auditoría',
    'Ingeniería Comercial'
  ],
  'Facultad de Ciencias Forestales y Recursos Naturales': [
    'Ingeniería en Conservación de Recursos Naturales',
    'Ingeniería Forestal'
  ],
  'Facultad de Ciencias Jurídicas y Sociales': [
    'Derecho'
  ],
  'Facultad de Ciencias Veterinarias': [
    'Medicina Veterinaria'
  ],
  'Facultad de Filosofía y Humanidades': [
    'Antropología',
    'Pedagogía en Comunicación en Lengua Inglesa',
    'Pedagogía en Educación Física, Deportes y Recreación',
    'Pedagogía en Educación Parvularia',
    'Pedagogía en Historia y Ciencias Sociales',
    'Pedagogía en Lenguaje y Comunicación',
    'Periodismo',
    'Psicología',
    'Trabajo Social'
  ],
  'Facultad de Medicina': [
    'Enfermería',
    'Kinesiología',
    'Medicina',
    'Obstetricia y Puericultura',
    'Odontología',
    'Tecnología Médica',
    'Terapia Ocupacional'
  ],
  'Facultad de Ciencias de la Ingeniería': [
    'Ingeniería Civil Acústica',
    'Ingeniería Civil Electrónica',
    'Ingeniería Civil en Informática',
    'Ingeniería Civil en Obras Civiles',
    'Ingeniería Civil Industrial',
    'Ingeniería Civil Mecánica',
    'Ingeniería en Construcción',
    'Ingeniería Naval',
    'Ingeniería Plan Común'
  ]
};

export const facultades = Object.keys(datosInstitucionales);

export interface OpcionFacultad {
  id: string;
  nombre: string;
}

export interface OpcionCarrera {
  id: string;
  nombre: string;
  facultadId: string;
  // Código oficial de la carrera; se completa desde el catálogo institucional
  // (GET /api/ambitos) y permanece ausente si no hay catálogo disponible.
  car_codigo?: string;
}

// Selectores jerárquicos: la facultad se identifica por su nombre y cada
// carrera lleva su facultad embebida en el id para garantizar unicidad global.
export const facultadesOptions: OpcionFacultad[] = Object.keys(datosInstitucionales).map(
  (nombre) => ({ id: nombre, nombre })
);

export const carrerasOptions: OpcionCarrera[] = Object.entries(datosInstitucionales).flatMap(
  ([facultadId, carreras]) =>
    carreras.map((nombre) => ({
      id: `${facultadId}::${nombre}`,
      nombre,
      facultadId,
    }))
);

// Fusiona los códigos oficiales del catálogo con las opciones estáticas,
// emparejando por nombre exacto de carrera. Sin catálogo o sin coincidencia,
// car_codigo queda ausente y el selector muestra solo el nombre.
export function aplicarCodigosCarreras(
  opciones: OpcionCarrera[],
  catalogo: { car_codigo: string; nombre: string }[],
): OpcionCarrera[] {
  if (catalogo.length === 0) return opciones;
  const codigos = new Map(catalogo.map((carrera) => [carrera.nombre, carrera.car_codigo]));
  return opciones.map((opcion) => {
    const car_codigo = codigos.get(opcion.nombre);
    return car_codigo ? { ...opcion, car_codigo } : opcion;
  });
}