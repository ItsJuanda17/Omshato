import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { StorageDisk } from "@nestjs/storage";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ImagenReloj } from "../catalogo/entities/imagen-reloj.entity.js";

/** Las fotos de los relojes en el disco de almacenamiento. */
@Injectable()
export class FotosService {
  constructor(
    private readonly disco: StorageDisk,
    @InjectRepository(ImagenReloj) private readonly imagenes: Repository<ImagenReloj>,
  ) {}

  /** Falla si alguna foto no está en el disco: evita fichas con imágenes rotas. */
  async exigirQueExisten(claves: string[]) {
    const existen = await Promise.all(claves.map((clave) => this.disco.exists(clave)));
    const faltantes = claves.filter((_, posicion) => !existen[posicion]);
    if (faltantes.length > 0) {
      throw new UnprocessableEntityException(
        "Una de las fotos no se subió o ya no existe. Vuelve a subirla.",
        { errorCode: "FOTO_NO_EXISTE" },
      );
    }
  }

  /**
   * Borra del disco las fotos que ningún reloj usa. Se llama después de quitar una foto de
   * un reloj o de eliminarlo. Es de mejor esfuerzo: un archivo que sobra no rompe nada,
   * y una foto que otro reloj sigue usando no se toca.
   */
  async borrarSinUso(claves: string[]) {
    if (claves.length === 0) {
      return;
    }
    const enUso = await this.imagenes
      .createQueryBuilder("imagen")
      .select("imagen.archivo", "archivo")
      .where("imagen.archivo IN (:...claves)", { claves })
      .getRawMany<{ archivo: string }>();
    const usadas = new Set(enUso.map((fila) => fila.archivo));

    await this.disco.delete(claves.filter((clave) => !usadas.has(clave))).catch(() => undefined);
  }
}
