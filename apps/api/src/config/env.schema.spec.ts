import { esquemaEnv } from "./env.schema.js";

const base = { DATABASE_URL: "postgres://usuario:clave@localhost:5432/omshato" };

describe("esquemaEnv", () => {
  it("aplica los valores por defecto", () => {
    const env = esquemaEnv.parse(base);

    expect(env.NODE_ENV).toBe("development");
    expect(env.PORT).toBe(3001);
    expect(env.CORS_ORIGIN).toBe("http://localhost:3000");
  });

  it("convierte el puerto de texto a número", () => {
    expect(esquemaEnv.parse({ ...base, PORT: "4100" }).PORT).toBe(4100);
  });

  it("exige DATABASE_URL", () => {
    const resultado = esquemaEnv.safeParse({});

    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0].path).toEqual(["DATABASE_URL"]);
  });

  it("rechaza una DATABASE_URL que no es de PostgreSQL", () => {
    expect(esquemaEnv.safeParse({ DATABASE_URL: "mysql://localhost/omshato" }).success).toBe(false);
  });

  it("rechaza un NODE_ENV desconocido", () => {
    expect(esquemaEnv.safeParse({ ...base, NODE_ENV: "staging" }).success).toBe(false);
  });
});
