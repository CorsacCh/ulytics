import path from "node:path";
import { fileURLToPath } from "node:url";
import swaggerJsdoc from "swagger-jsdoc";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ULYTICS API",
      version: "1.0.0",
    },
    servers: [{ url: "/api" }],
  },
  apis: [
    path.resolve(configDirectory, "../routes/*.js"),
    path.resolve(configDirectory, "../app.js"),
  ],
});

export default swaggerSpec;