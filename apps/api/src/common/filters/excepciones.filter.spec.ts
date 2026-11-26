import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import type { MockInstance } from "vitest";

import { type CuerpoError, FiltroExcepciones } from "./excepciones.filter.js";

function crearFiltro() {
  const reply = vi.fn();
  const adaptador = {
    httpAdapter: { reply, getRequestUrl: () => "/api/relojes/9?email=ana@correo.com" },
  } as unknown as HttpAdapterHost;
  const host = {
    switchToHttp: () => ({ getRequest: () => ({}), getResponse: () => "respuesta" }),
  } as unknown as ArgumentsHost;

  const capturar = (excepcion: unknown) => {
    new FiltroExcepciones(adaptador).catch(excepcion, host);
    const [respuesta, cuerpo, estado] = reply.mock.calls[0] as [string, CuerpoError, number];
    return { respuesta, cuerpo, estado };
  };
  return { capturar };
}

describe("FiltroExcepciones", () => {
  let registrarError: MockInstance;

  beforeEach(() => {
    registrarError = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });

  it("da un código estable y el mensaje de una excepción HTTP", () => {
    const { capturar } = crearFiltro();

    const { cuerpo, estado } = capturar(new NotFoundException("No encontramos ese reloj."));

    expect(estado).toBe(404);
    expect(cuerpo).toMatchObject({
      estado: 404,
      codigo: "NO_ENCONTRADO",
      mensaje: "No encontramos ese reloj.",
    });
  });

  it("no incluye la consulta de la URL, que puede traer datos personales", () => {
    const { capturar } = crearFiltro();

    const { cuerpo } = capturar(new NotFoundException());

    expect(cuerpo.ruta).toBe("/api/relojes/9");
  });

  it("separa por campo los errores de validación", () => {
    const { capturar } = crearFiltro();

    const { cuerpo, estado } = capturar(
      new BadRequestException([
        "telefono: Escribe un celular de 10 dígitos.",
        "direccion: Escribe la dirección.",
      ]),
    );

    expect(estado).toBe(400);
    expect(cuerpo.codigo).toBe("DATOS_INVALIDOS");
    expect(cuerpo.mensaje).toBe("Los datos enviados no son válidos.");
    expect(cuerpo.detalles).toEqual([
      { campo: "telefono", mensaje: "Escribe un celular de 10 dígitos." },
      { campo: "direccion", mensaje: "Escribe la dirección." },
    ]);
  });

  it("prefiere el errorCode de la excepción al código del estado", () => {
    const { capturar } = crearFiltro();

    const { cuerpo } = capturar(
      new ConflictException("Un pedido enviado no se puede cancelar.", {
        errorCode: "TRANSICION_NO_PERMITIDA",
      }),
    );

    expect(cuerpo.codigo).toBe("TRANSICION_NO_PERMITIDA");
    expect(cuerpo.estado).toBe(409);
  });

  it("no filtra el mensaje de un error inesperado y lo registra", () => {
    const { capturar } = crearFiltro();

    const { cuerpo, estado } = capturar(new Error("connection refused a 10.0.0.5"));

    expect(estado).toBe(500);
    expect(cuerpo.codigo).toBe("ERROR_INTERNO");
    expect(JSON.stringify(cuerpo)).not.toContain("10.0.0.5");
    expect(registrarError).toHaveBeenCalled();
  });
  it("traduce el código y el mensaje en inglés que pone el paquete de autenticación", () => {
    const { capturar } = crearFiltro();

    const { cuerpo } = capturar(
      new UnauthorizedException("Unauthorized", { errorCode: "missing_credentials" }),
    );

    expect(cuerpo).toMatchObject({
      estado: 401,
      codigo: "NO_AUTENTICADO",
      mensaje: "Inicia sesión para continuar.",
    });
  });

  it("pone en español el mensaje genérico de una ruta que no existe", () => {
    const { capturar } = crearFiltro();

    const { cuerpo } = capturar(new NotFoundException("Cannot GET /api/no-existe"));

    expect(cuerpo.mensaje).toBe("No encontramos lo que buscas.");
  });

  it("respeta un mensaje propio aunque el estado tenga uno genérico", () => {
    const { capturar } = crearFiltro();

    const { cuerpo } = capturar(new UnauthorizedException("Correo o contraseña incorrectos."));

    expect(cuerpo.mensaje).toBe("Correo o contraseña incorrectos.");
  });
});
