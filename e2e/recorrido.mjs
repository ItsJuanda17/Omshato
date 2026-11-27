// Recorrido de extremo a extremo: el sitio y el panel en un navegador real, contra el API real y
// una base de datos recién creada con los datos de demostración. Depende de ese estado inicial
// (números de pedido, relojes de ejemplo), por eso lo prepara `correr.mjs`.

/**
 * @param {object} contexto
 * @param {Awaited<ReturnType<typeof import("./navegador.mjs").abrirNavegador>>} contexto.nav
 * @param {ReturnType<typeof import("./navegador.mjs").crearInforme>} contexto.informe
 * @param {string} contexto.base      Dirección del sitio (Next).
 * @param {string} contexto.api       Dirección del API, con `/api`.
 * @param {string} contexto.foto      Ruta de una imagen para subir como foto de un reloj.
 * @param {{ prueba: Cuenta, bloqueo: Cuenta, nuevaContrasena: string }} contexto.cuentas
 *
 * @typedef {{ correo: string, contrasena: string }} Cuenta
 */
export async function recorrido({ nav, informe, base, api, foto, cuentas }) {
  const { ev, ir, ruta, texto, clic, escribir, esperar, cuenta: contar } = nav;
  const ok = informe.verificar;
  const publico = async (ruta) => (await fetch(base + ruta)).text();
  const estadoPublico = async (ruta) => (await fetch(base + ruta)).status;

  // ---------- Sitio público ----------
  let html = await publico("/");
  ok(
    "catálogo muestra relojes del API",
    html.includes("PRX Powermatic") && html.includes("Heritage Skeleton"),
  );
  ok(
    "catálogo oculta los relojes ocultos",
    !html.includes("Promaster Dive") && !html.includes("Aquis Date"),
  );

  await ir("/relojes/tissot-prx-powermatic-80", 2500);
  let t = await texto();
  ok("ficha muestra nombre y precio", t.includes("PRX Powermatic 80") && t.includes("3.450.000"));
  ok("ficha muestra la mecánica", t.includes("Powermatic 80.111"));
  ok(
    "la foto de la ficha carga (API → Next → navegador)",
    (await ev(
      `[...document.querySelectorAll('main img')].some(i => i.complete && i.naturalWidth > 0)`,
    )) === true,
  );
  await nav.captura("ficha");
  ok(
    "ficha oculta da 404",
    (await estadoPublico("/relojes/citizen-promaster-dive-automatic")) === 404,
  );
  ok("ficha inexistente da 404", (await estadoPublico("/relojes/no-existe")) === 404);

  // ---------- Pedido ----------
  async function hacerPedido(slug, idDepartamento, idCiudad, telefono, nombre) {
    await ir(`/pedido/${slug}`, 2500);
    await ev(`document.querySelector('button[type=submit]').click()`);
    await esperar(500);
    const errores = await contar('[id$="-error"]');
    ok(`[${slug}] el envío vacío muestra errores`, errores >= 4, String(errores));
    await escribir("#nombre", nombre);
    await escribir("#telefono", telefono);
    await escribir("#direccion", "Calle 10 # 5-20");
    await escribir("#departamento", idDepartamento);
    await esperar(300);
    await escribir("#ciudad", idCiudad);
    await ev(`document.querySelector('[role=checkbox]').click()`);
    await esperar(300);
    await ev(`document.querySelector('button[type=submit]').click()`);
    await esperar(3000);
    const crudo = (await texto()).raw;
    return { ruta: await ruta(), numero: crudo.match(/oms-\d+/)?.[0], texto: crudo };
  }

  const p1 = await hacerPedido(
    "tissot-prx-powermatic-80",
    "5",
    "5001",
    "300-123-4567",
    "Ana María Pérez",
  );
  ok(
    "pedido bajo pedido → confirmación con número",
    p1.ruta === "/confirmacion" && p1.numero === "oms-0001",
    `${p1.ruta} ${p1.numero}`,
  );
  ok("la confirmación habla del proveedor", p1.texto.includes("proveedor"));
  await nav.captura("confirmacion");

  const p2 = await hacerPedido(
    "seiko-5-sports-suit-style",
    "11",
    "11001",
    "3109998877",
    "Luis Gómez",
  );
  ok(
    "pedido disponible → OMS-0002",
    p2.ruta === "/confirmacion" && p2.numero === "oms-0002",
    `${p2.ruta} ${p2.numero}`,
  );

  // ---------- Panel: acceso ----------
  await ir("/admin/pedidos");
  ok("sin sesión redirige al login", (await ruta()) === "/admin/login", await ruta());

  async function entrar(correo, contrasena, espera = 3000) {
    await ir("/admin/login", 1500);
    await escribir("#correo", correo);
    await escribir("#contrasena", contrasena);
    await clic("Ingresar al panel");
    await esperar(espera);
  }

  await entrar(cuentas.prueba.correo, "incorrecta", 1500);
  t = await texto();
  ok("credenciales incorrectas: mensaje genérico", t.includes("Correo o contraseña incorrectos"));
  ok(
    "conserva el correo",
    (await ev("document.querySelector('#correo').value")) === cuentas.prueba.correo,
  );

  await escribir("#contrasena", cuentas.prueba.contrasena);
  await clic("Ingresar al panel");
  await esperar(3000);
  ok("entra al panel", (await ruta()) === "/admin/pedidos", await ruta());
  const cookies = await nav.cookies();
  ok(
    "la cookie de sesión es HttpOnly",
    cookies.find((c) => c.name === "omshato_sesion")?.httpOnly === true,
  );
  ok("el navegador no recibe la cookie del API", !cookies.some((c) => c.name === "__Host-sid"));

  // ---------- Panel: pedidos ----------
  await esperar(800);
  const filas = await contar('main ul a[href^="/admin/pedidos/"]');
  ok("lista los 2 pedidos hechos", filas === 2, String(filas));
  await nav.captura("pedidos");

  await ir("/admin/pedidos/1", 2500);
  t = await texto();
  ok(
    "detalle del pedido 1",
    t.includes("OMS-0001") && t.includes("Por conseguir con proveedor") && t.includes("Medellín"),
  );
  ok(
    "enlace de WhatsApp al comprador",
    await ev(`document.querySelector('a[href^="https://wa.me/573001234567"]') !== null`),
  );
  await escribir("#nota-interna", "Proveedor respondió: sí hay stock.");
  await clic("Agregar nota");
  await esperar(1200);
  ok("agrega una nota interna", (await texto()).includes("Proveedor respondió: sí hay stock."));
  await clic("Confirmar pedido");
  await esperar(500);
  await clic("Sí, cambiar estado");
  await esperar(1500);
  t = await texto();
  ok("pasa a confirmado", t.includes("Marcar como enviado") && !t.includes("Confirmar pedido"));
  ok("el historial crece", (await contar("ol li")) >= 2);
  await nav.captura("detalle-pedido");

  await ir("/admin/pedidos/2", 2500);
  await clic("Cancelar pedido");
  await esperar(500);
  await clic("Sí, cancelar el pedido");
  await esperar(700);
  ok(
    "cancelar sin motivo da error",
    (await texto()).includes("Escribe el motivo de la cancelación"),
  );
  await escribir("#motivo-cancelacion", "El comprador no respondió.");
  await clic("Sí, cancelar el pedido");
  await esperar(1500);
  t = await texto();
  ok("queda cancelado", t.includes("estado final") && t.includes("El comprador no respondió."));

  // ---------- Panel: relojes ----------
  const reloj = (nombre) =>
    `[...document.querySelectorAll('main ul > li')].find(li => li.textContent.includes(${JSON.stringify(nombre)}))`;

  await ir("/admin/relojes", 2500);
  let relojes = await contar("main ul > li");
  ok("lista los 8 relojes (visibles y ocultos)", relojes === 8, String(relojes));
  await ev(`${reloj("PRX Powermatic")}.querySelector('button:last-child').click()`);
  await esperar(600);
  t = await texto();
  ok(
    "no deja eliminar un reloj con pedidos",
    t.includes("no se puede eliminar") && t.includes("Ocultar reloj"),
  );
  await clic("Cerrar", "dialog button");
  await esperar(300);

  await ev(`${reloj("G-Shock")}.querySelector('button:last-child').click()`);
  await esperar(500);
  await clic("Sí, eliminar");
  await esperar(1800);
  relojes = await contar("main ul > li");
  ok("elimina un reloj sin pedidos", relojes === 7, String(relojes));
  ok("el eliminado ya no está en el catálogo", !(await publico("/")).includes("G-Shock GA-2100"));

  ok("Gentleman visible", (await publico("/")).includes("Gentleman Powermatic"));
  await ev(`${reloj("Gentleman")}.querySelectorAll('button')[1].click()`);
  await esperar(1500);
  ok("ocultar lo saca del catálogo", !(await publico("/")).includes("Gentleman Powermatic"));
  ok(
    "su ficha da 404",
    (await estadoPublico("/relojes/tissot-gentleman-powermatic-80-silicium")) === 404,
  );

  await ev(`${reloj("HydroConquest")}.querySelectorAll('button')[0].click()`);
  await esperar(1500);
  ok("cambia el modo", /hydroconquest[\s\S]{0,160}bajo pedido/.test((await texto()).raw));

  // Crear un reloj subiendo una foto de verdad
  await ir("/admin/relojes/nuevo", 2500);
  await escribir("#nombre", "Aquatimer Automatic");
  await escribir("#precio", "3.5");
  await clic("Agregar reloj", "button[type=submit]");
  await esperar(700);
  t = await texto();
  ok(
    "valida precio, marca y foto",
    t.includes("número entero mayor que cero") &&
      t.includes("Elige una marca") &&
      t.includes("Agrega al menos una foto"),
  );
  await escribir("#marca", "nueva");
  await esperar(300);
  await escribir("#marcaNueva", "IWC");
  await escribir("#genero", "Hombre");
  await escribir("#precio", "15900000");
  await escribir("#garantia", "24 meses");
  await nav.subirArchivo("input[type=file]", foto);
  await esperar(3000);
  t = await texto();
  ok("sube la foto y la muestra como principal", t.includes("Principal") && t.includes("Foto 1"));
  ok(
    "la miniatura de la foto subida carga",
    (await ev(
      `[...document.querySelectorAll('ol li img')].some(i => i.complete && i.naturalWidth > 0)`,
    )) === true,
  );
  await nav.captura("reloj-formulario");
  await clic("Agregar reloj", "button[type=submit]");
  await esperar(3000);
  ok("vuelve a la lista", (await ruta()) === "/admin/relojes", await ruta());
  html = await publico("/");
  ok(
    "el reloj nuevo ya está en el catálogo",
    html.includes("Aquatimer Automatic") && html.includes("IWC"),
  );
  const nuevo = (await fetch(`${api}/relojes`).then((r) => r.json())).find(
    (r) => r.nombre === "Aquatimer Automatic",
  );
  const respuestaFoto = await fetch(`${base}/fotos/${nuevo.imagenPrincipal.archivo}`);
  ok(
    "la foto subida se sirve",
    respuestaFoto.status === 200 && respuestaFoto.headers.get("content-type") === "image/png",
  );

  // Editar: el formulario carga lo guardado
  await ev(`${reloj("Aquatimer")}.querySelector('a').click()`);
  await esperar(2500);
  ok(
    "la edición carga los datos",
    (await ev("document.querySelector('#nombre')?.value")) === "Aquatimer Automatic",
  );

  // ---------- Panel: enlaces ----------
  await ir("/admin/enlaces", 2500);
  ok("Instagram visible en el pie", (await publico("/ayuda")).includes("instagram.com/omsha_to"));
  await ev(`document.querySelectorAll('[role=checkbox]')[1].click()`);
  await esperar(300);
  await clic("Guardar cambios");
  await esperar(1800);
  ok("guarda los enlaces", (await texto()).includes("Cambios guardados"));
  ok("Instagram desaparece del pie", !(await publico("/ayuda")).includes("instagram.com/omsha_to"));
  await escribir("#whatsapp-valor", "abc");
  await clic("Guardar cambios");
  await esperar(900);
  ok("rechaza un WhatsApp inválido", (await texto()).includes("número válido"));

  // ---------- Panel: cambio de contraseña (CU-12) ----------
  const iniciarOtraSesion = async () => {
    const respuesta = await fetch(`${api}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuentas.prueba),
    });
    return respuesta.headers
      .getSetCookie()
      .find((c) => c.startsWith("__Host-sid="))
      ?.split(";")[0];
  };
  const yoConCookie = async (cookie) =>
    (await fetch(`${api}/auth/yo`, { headers: { Cookie: cookie } })).status;
  const llenarCambio = async (actual, nueva, confirmacion) => {
    await escribir("#contrasena-actual", actual);
    await escribir("#contrasena-nueva", nueva);
    await escribir("#contrasena-confirmacion", confirmacion);
    await clic("Cambiar contraseña", "button[type=submit]");
    await esperar(1500);
  };

  const otroDispositivo = await iniciarOtraSesion();
  ok(
    "hay una segunda sesión abierta (otro dispositivo)",
    Boolean(otroDispositivo) && (await yoConCookie(otroDispositivo)) === 200,
  );

  await ir("/admin/pedidos", 2000);
  await clic("Mi cuenta", "a");
  await esperar(2200);
  ok("el menú lleva a Mi cuenta", (await ruta()) === "/admin/cuenta", await ruta());
  ok("Mi cuenta muestra el correo", (await texto()).includes(cuentas.prueba.correo));
  await nav.captura("cuenta");

  await clic("Cambiar contraseña", "button[type=submit]");
  await esperar(600);
  ok(
    "el envío vacío pide la contraseña actual",
    (await texto()).includes("Escribe tu contraseña actual"),
  );

  await llenarCambio(cuentas.prueba.contrasena, "corta", "corta");
  ok("rechaza una contraseña nueva corta", (await texto()).includes("al menos 10 caracteres"));
  await llenarCambio(cuentas.prueba.contrasena, cuentas.nuevaContrasena, "otra-distinta-123");
  ok("exige repetirla igual", (await texto()).includes("no coinciden"));
  await llenarCambio(
    cuentas.prueba.contrasena,
    cuentas.prueba.contrasena,
    cuentas.prueba.contrasena,
  );
  ok("rechaza una nueva igual a la actual", (await texto()).includes("distinta de la actual"));
  await llenarCambio("no-es-la-actual-123", cuentas.nuevaContrasena, cuentas.nuevaContrasena);
  ok("rechaza la contraseña actual equivocada", (await texto()).includes("actual no es correcta"));
  ok("sigue en la misma pantalla", (await ruta()) === "/admin/cuenta");

  const antes = (await nav.cookies()).find((c) => c.name === "omshato_sesion")?.value;
  await llenarCambio(cuentas.prueba.contrasena, cuentas.nuevaContrasena, cuentas.nuevaContrasena);
  ok("confirma el cambio", (await texto()).includes("Contraseña actualizada"));
  ok("vacía el formulario", (await ev("document.querySelector('#contrasena-nueva').value")) === "");
  const despues = (await nav.cookies()).find((c) => c.name === "omshato_sesion")?.value;
  ok("guarda el token nuevo de la sesión", Boolean(despues) && despues !== antes);
  await ir("/admin/pedidos", 2200);
  ok(
    "el panel sigue abierto con la sesión nueva",
    (await ruta()) === "/admin/pedidos",
    await ruta(),
  );
  ok("la sesión del otro dispositivo se cerró", (await yoConCookie(otroDispositivo)) === 401);

  // ---------- Cierre de sesión y claves ----------
  await clic("Cerrar sesión");
  await esperar(2500);
  ok("cerrar sesión lleva al login", (await ruta()) === "/admin/login", await ruta());
  await ir("/admin/pedidos");
  ok("tras salir, el panel pide iniciar sesión", (await ruta()) === "/admin/login");
  ok(
    "la cookie de sesión se borró",
    !(await nav.cookies()).some((c) => c.name === "omshato_sesion"),
  );

  await entrar(cuentas.prueba.correo, cuentas.prueba.contrasena, 2000);
  ok(
    "la contraseña anterior ya no sirve",
    (await ruta()) === "/admin/login" &&
      (await texto()).includes("Correo o contraseña incorrectos"),
  );
  await entrar(cuentas.prueba.correo, cuentas.nuevaContrasena);
  ok("la contraseña nueva sí entra", (await ruta()) === "/admin/pedidos", await ruta());
  await clic("Cerrar sesión");
  await esperar(2500);

  // ---------- Bloqueo por intentos (otra cuenta, para no bloquear la de pruebas) ----------
  let ultimo = "";
  for (let intento = 1; intento <= 5; intento += 1) {
    await entrar(cuentas.bloqueo.correo, "clave-equivocada", 1500);
    ultimo = (await texto()).raw;
  }
  ok("los 5 primeros fallos dicen lo mismo", ultimo.includes("correo o contraseña incorrectos"));
  await entrar(cuentas.bloqueo.correo, cuentas.bloqueo.contrasena, 1800);
  ok(
    "al sexto intento la cuenta está bloqueada, aun con la clave correcta",
    (await texto()).includes("demasiados intentos") && (await ruta()) === "/admin/login",
  );
  await nav.captura("bloqueo");
}
