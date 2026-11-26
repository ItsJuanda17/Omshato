import { Public } from "@nestjs/authentication";
import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { serveFile, StorageDisk, type StoredUpload, uploadToDisk } from "@nestjs/storage";
import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { z } from "zod";

/** Solo imágenes, reconocidas por el contenido del archivo y no por lo que diga el nombre. */
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const TAMANO_MAXIMO = 5 * 1024 * 1024;

const esquemaArchivo = z.string().regex(/^[\w-]+\.(png|jpe?g|webp|avif)$/i);

@Controller()
export class FotosController {
  constructor(private readonly disco: StorageDisk) {}

  /**
   * Sube una foto y devuelve su clave, que luego se envía al crear o editar un reloj. El
   * nombre del archivo que manda el navegador se ignora: la clave es un identificador
   * aleatorio, así nadie puede pisar la foto de otro reloj ni apuntar fuera de la carpeta.
   */
  @Post("admin/fotos")
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor("foto", {
      storage: uploadToDisk({
        contentTypes: TIPOS_PERMITIDOS,
        key: (archivo) => `relojes/${randomUUID()}${archivo.extension}`,
        cacheControl: "public, max-age=31536000, immutable",
      }),
      limits: { fileSize: TAMANO_MAXIMO, files: 1 },
    }),
  )
  subir(@UploadedFile() archivo: StoredUpload | undefined) {
    if (!archivo) {
      throw new BadRequestException("Adjunta la foto en el campo «foto».", {
        errorCode: "FOTO_REQUERIDA",
      });
    }
    return { archivo: archivo.key };
  }

  /** La foto de un reloj. Pública: es la que muestra el catálogo. */
  @Public()
  @Get("fotos/relojes/:archivo")
  ver(
    @Param("archivo", { schema: esquemaArchivo }) archivo: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Helmet marca los recursos como del mismo origen; el front vive en otro y debe poder mostrarlas.
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    return serveFile(this.disco, `relojes/${archivo}`, {
      req,
      res,
      disposition: "inline",
      // El nombre es un UUID nuevo en cada subida, así que nunca cambia su contenido.
      cacheControl: "public, max-age=31536000, immutable",
    });
  }
}
