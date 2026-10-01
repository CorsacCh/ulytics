import { Carrera } from "../persistence/models/index.js";
import { AppError } from "../utils/app-error.js";

export async function getFacultyCareers(request, response, next) {
  try {
    const scope = request.auth?.publicUser?.ambito;

    if (!scope || scope.tipo !== "FACULTAD") {
      throw new AppError(
        "El usuario no tiene un ámbito de facultad válido.",
        403,
        "FACULTY_SCOPE_REQUIRED"
      );
    }

    const careers = await Carrera.findAll({
      where: { id_macrounidad: scope.codigo },
      attributes: ["car_codigo", "nombre", "sede", "id_macrounidad"],
      order: [["nombre", "ASC"]]
    });

    return response.json({
      facultad: {
        codigo: scope.codigo,
        nombre: scope.nombre
      },
      carreras: careers
    });
  } catch (error) {
    return next(error);
  }
}
