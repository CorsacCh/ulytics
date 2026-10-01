import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import {
  loginLimiter,
  loginRateLimitKey
} from "../src/middlewares/login-rate-limit.middleware.js";

const requestFor = (email, ip = "192.0.2.10") => ({
  body: { email },
  ip
});

test("separa los intentos de cuentas distintas aunque compartan la misma red", () => {
  const firstAccount = loginRateLimitKey(requestFor("primera@uach.cl"));
  const secondAccount = loginRateLimitKey(requestFor("segunda@uach.cl"));

  assert.notEqual(firstAccount, secondAccount);
});

test("normaliza el correo antes de identificar la cuenta", () => {
  const normalized = loginRateLimitKey(requestFor("persona@uach.cl"));
  const withDifferentCase = loginRateLimitKey(requestFor("  PERSONA@UACH.CL  "));

  assert.equal(normalized, withDifferentCase);
});

test("no incorpora el correo en texto plano en la clave del limitador", () => {
  const key = loginRateLimitKey(requestFor("persona@uach.cl"));

  assert.equal(key.includes("persona@uach.cl"), false);
});

test("el bloqueo de una cuenta no afecta otra cuenta de la misma red", async (context) => {
  const app = express();
  app.use(express.json());
  app.post("/login", loginLimiter, (request, response) => {
    if (request.body.password === "correcta") {
      return response.status(200).json({ ok: true });
    }
    return response.status(401).json({ ok: false });
  });

  const server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  context.after(() => new Promise((resolve) => server.close(resolve)));

  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/login`;
  const requestLogin = (email, password = "incorrecta") => fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await requestLogin("bloqueada@uach.cl");
    assert.equal(response.status, 401);
  }

  const blockedResponse = await requestLogin("bloqueada@uach.cl");
  assert.equal(blockedResponse.status, 429);

  const otherAccountResponse = await requestLogin("independiente@uach.cl");
  assert.equal(otherAccountResponse.status, 401);

  for (let attempt = 0; attempt < 11; attempt += 1) {
    const successfulResponse = await requestLogin("exitosa@uach.cl", "correcta");
    assert.equal(successfulResponse.status, 200);
  }
});
