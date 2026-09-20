import { AppError } from "../utils/app-error.js";

export function validate(schema, source = "body") {
  return (request, _response, next) => {
    const result = schema.safeParse(request[source]);

    if (!result.success) {
      return next(
        new AppError("Datos de entrada inválidos.", 422, "VALIDATION_ERROR", {
          fields: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message
          }))
        })
      );
    }

    request[source] = result.data;
    return next();
  };
}
