import { Public } from "@nestjs/authentication";
import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  /** Sirve para saber si el API está vivo: balanceadores, despliegue y pruebas. */
  @Public()
  @Get("salud")
  salud() {
    return { estado: "ok" };
  }
}
