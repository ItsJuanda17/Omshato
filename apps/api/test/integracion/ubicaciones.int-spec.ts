import request from "supertest";

import { type ContextoIntegracion, crearAppConBaseDeDatos } from "../ayudantes/app-integracion.js";

let contexto: ContextoIntegracion;

beforeAll(async () => {
  contexto = await crearAppConBaseDeDatos();
});

afterAll(async () => {
  await contexto.cerrar();
});

const http = () => request(contexto.app.getHttpServer());

describe("ubicaciones (públicas)", () => {
  it("lista los 33 departamentos en orden alfabético sin pedir sesión", async () => {
    const respuesta = await http().get("/api/ubicaciones/departamentos").expect(200);

    expect(respuesta.body).toHaveLength(33);
    const nombres: string[] = respuesta.body.map((d: { nombre: string }) => d.nombre);
    expect(nombres).toEqual(nombres.toSorted((a, b) => a.localeCompare(b, "es")));
    expect(respuesta.body).toContainEqual({ id: 5, codigoDane: "05", nombre: "Antioquia" });
  });

  it("lista las 1.122 ciudades con la forma que espera el front", async () => {
    const respuesta = await http().get("/api/ubicaciones/ciudades").expect(200);

    expect(respuesta.body).toHaveLength(1122);
    expect(respuesta.body).toContainEqual({
      id: 5001,
      idDepartamento: 5,
      codigoDane: "05001",
      nombre: "Medellín",
    });
  });

  it("filtra las ciudades por departamento", async () => {
    const respuesta = await http().get("/api/ubicaciones/ciudades?idDepartamento=5").expect(200);

    expect(respuesta.body.length).toBeGreaterThan(100);
    expect(respuesta.body.every((c: { idDepartamento: number }) => c.idDepartamento === 5)).toBe(
      true,
    );
  });

  it("rechaza un filtro que no es un número", async () => {
    const respuesta = await http().get("/api/ubicaciones/ciudades?idDepartamento=abc").expect(400);

    expect(respuesta.body.codigo).toBe("DATOS_INVALIDOS");
  });
});
