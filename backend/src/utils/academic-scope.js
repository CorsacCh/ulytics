const INSTITUTIONAL_ROLES = new Set(["ADMIN", "AUTORIDAD_CENTRAL"]);

const normalized = (value) => String(value ?? "").trim().toUpperCase();

/**
 * Evalúa si un usuario puede consultar una carrera según su rol y ámbito.
 * Esta regla se ejecuta en el backend; el selector del frontend no es una
 * medida de seguridad.
 */
export function canAccessCareer({
  roleCode,
  scopeType,
  scopeCode,
  careerCode,
  facultyCode
}) {
  const role = normalized(roleCode);
  const type = normalized(scopeType);
  const scope = normalized(scopeCode);
  const career = normalized(careerCode);
  const faculty = normalized(facultyCode);

  if (!role || !type || !scope || !career || !faculty) return false;

  if (INSTITUTIONAL_ROLES.has(role)) {
    return type === "INSTITUCION";
  }

  if (role === "DECANO") {
    return type === "FACULTAD" && scope === faculty;
  }

  if (role === "DIRECTOR") {
    return type === "PROGRAMA" && scope === career;
  }

  return false;
}
