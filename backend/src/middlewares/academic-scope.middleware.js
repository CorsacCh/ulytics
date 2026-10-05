import { Carrera } from "../persistence/models/index.js";
import { AppError } from "../utils/app-error.js";
import { canAccessCareer } from "../utils/academic-scope.js";

/** El Home del director siempre consulta la carrera de la sesión. */
export async function authorizeDirectorCareer(request, response, next) {
  const user = request.auth?.publicUser;
  const scope = user?.ambito;
  if (user?.rol?.codigo !== 'DIRECTOR' || scope?.tipo !== 'PROGRAMA' || !scope.codigo) {
    return next(new AppError('La cuenta no tiene un ámbito de carrera válido.', 403, 'ACADEMIC_SCOPE_FORBIDDEN'));
  }

  // Compatibilidad con clientes anteriores: un código enviado por query jamás
  // puede sustituir al de la sesión. Rechazar también arrays y objetos.
  const requestedCode = request.query.car_codigo;
  if (requestedCode !== undefined && (
    typeof requestedCode !== 'string' || requestedCode.trim() !== scope.codigo
  )) {
    return next(new AppError('No tiene autorización para consultar esta carrera.', 403, 'ACADEMIC_SCOPE_FORBIDDEN'));
  }

  request.params.car_codigo = scope.codigo;
  return authorizeCareerScope(request, response, next);
}

/**
 * Carga la carrera indicada en la URL y comprueba el ámbito del usuario.
 * Deja la instancia en request.academicCareer para evitar otra consulta en
 * el controlador de reportería.
 */
export async function authorizeCareerScope(request, _response, next) {
  try {
    const careerCode = request.params.car_codigo;
    const career = await Carrera.findByPk(careerCode);

    if (!career) {
      throw new AppError("Carrera no encontrada.", 404, "CAREER_NOT_FOUND");
    }

    const user = request.auth?.publicUser;
    const allowed = canAccessCareer({
      roleCode: user?.rol?.codigo,
      scopeType: user?.ambito?.tipo,
      scopeCode: user?.ambito?.codigo,
      careerCode: career.car_codigo,
      facultyCode: career.id_macrounidad
    });

    if (!allowed) {
      throw new AppError(
        "No tiene autorización para consultar esta carrera.",
        403,
        "ACADEMIC_SCOPE_FORBIDDEN"
      );
    }

    request.academicCareer = career;
    return next();
  } catch (error) {
    return next(error);
  }
}
