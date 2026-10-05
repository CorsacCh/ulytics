import path from "node:path";
import { fileURLToPath } from "node:url";
import swaggerJsdoc from "swagger-jsdoc";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const routePattern = (relativePath) => path.resolve(configDirectory, relativePath).replaceAll('\\', '/');

const swaggerSpec = swaggerJsdoc({
  failOnErrors: true,
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ULYTICS API",
      version: "1.0.0",
    },
    servers: [{ url: "/api" }],
  },
  apis: [
    routePattern("../routes/*.js"),
    routePattern("../app.js"),
  ],
});

export default swaggerSpec;
