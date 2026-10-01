import { Carrera } from "../persistence/models/index.js";
import { AppError } from "../utils/app-error.js";
import { canAccessCareer } from "../utils/academic-scope.js";

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
