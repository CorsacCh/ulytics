import { AppError } from "../utils/app-error.js";

export function notFoundHandler(request, _response, next) {
  next(
    new AppError(
      `La ruta ${request.method} ${request.originalUrl} no existe.`,
      404,
      "ROUTE_NOT_FOUND"
    )
  );
}

export function errorHandler(error, _request, response, _next) {
  if (error.name === "SequelizeUniqueConstraintError") {
    return response.status(409).json({
      error: { code: "DUPLICATE_VALUE", message: "El registro ya existe." }
    });
  }

  const statusCode = error.statusCode || 500;
  const body = {
    error: {
      code: error.code || "INTERNAL_ERROR",
      message:
        statusCode === 500 ? "Ocurrió un error interno." : error.message
    }
  };

  if (error.details) body.error.details = error.details;
  if (statusCode === 500 && process.env.NODE_ENV !== "test") {
    console.error(error);
  }

  return response.status(statusCode).json(body);
}
