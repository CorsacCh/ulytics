import "dotenv/config";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";
import adminUserRoutes from "./routes/admin-users.routes.js";
import cargaRoutes from './routes/carga.routes.js';
import reporteriaRoutes from './routes/reporteria.routes.js';
import ambitoRoutes from './routes/ambito.routes.js';
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

const app = express();
const allowedOrigins = (process.env.ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);

if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0) {
  throw new Error("TRUST_PROXY_HOPS debe ser un entero mayor o igual a cero.");
}

if (trustProxyHops > 0) {
  app.set("trust proxy", trustProxyHops);
}

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminUserRoutes);
app.use("/api/cargas", cargaRoutes);
app.use('/api/reporteria', reporteriaRoutes);
app.use('/api/ambitos', ambitoRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
