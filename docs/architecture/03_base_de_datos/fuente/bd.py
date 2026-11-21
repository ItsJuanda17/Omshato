"""Genera el MER y el MR de Omshato (Graphviz). Uso: python3 bd.py"""
import subprocess

FONT = "Liberation Sans"

# ---------------------------------------------------------------- datos del modelo
ENT = {  # entidad: lista de atributos (el primero es el identificador)
    "MARCA": ["id_marca", "nombre"],
    "RELOJ": ["id_reloj", "nombre", "genero", "precio_cop", "cantidad", "garantia", "detalle_mecanica", "descripcion",
              "modo", "visible", "plazo_estimado", "url_amigable", "fecha_publicacion", "fecha_actualizacion"],
    "IMAGEN_RELOJ": ["id_imagen", "archivo", "orden", "es_principal"],
    "PEDIDO": ["id_pedido", "numero_pedido", "nombre_reloj", "precio_reloj", "modo_reloj", "nombre_comprador",
               "telefono_comprador", "direccion", "fecha_autorizacion_datos", "motivo_cancelacion",
               "clave_idempotencia", "fecha_creacion"],
    "ESTADO_PEDIDO": ["id_estado", "nombre"],
    "HISTORIAL_ESTADO": ["id_historial", "fecha_hora"],
    "NOTA_PEDIDO": ["id_nota", "texto", "fecha_hora"],
    "ADMINISTRADOR": ["id_administrador", "nombre", "correo", "contrasena_hash", "intentos_fallidos",
                      "bloqueado_hasta", "fecha_creacion"],
    "HISTORIAL_PRECIO": ["id_cambio", "precio_anterior", "precio_nuevo", "fecha_hora"],
    "DEPARTAMENTO": ["id_departamento", "codigo_dane", "nombre"],
    "CIUDAD": ["id_ciudad", "codigo_dane", "nombre"],
    "ENLACE_CONTACTO": ["id_enlace", "tipo", "valor", "activo"],
}
# relación: (id, nombre, entidadA, cardA, entidadB, cardB)
REL = [
    ("r1", "agrupa", "MARCA", "(0,N)", "RELOJ", "(1,1)"),
    ("r2", "tiene fotos", "RELOJ", "(1,N)", "IMAGEN_RELOJ", "(1,1)"),
    ("r3", "se solicita en", "RELOJ", "(0,N)", "PEDIDO", "(1,1)"),
    ("r4", "está en", "PEDIDO", "(1,1)", "ESTADO_PEDIDO", "(0,N)"),
    ("r5", "registra", "PEDIDO", "(1,N)", "HISTORIAL_ESTADO", "(1,1)"),
    ("r6", "deja en", "HISTORIAL_ESTADO", "(1,1)", "ESTADO_PEDIDO", "(0,N)"),
    ("r7", "realiza", "ADMINISTRADOR", "(0,N)", "HISTORIAL_ESTADO", "(0,1)"),
    ("r8", "tiene notas", "PEDIDO", "(0,N)", "NOTA_PEDIDO", "(1,1)"),
    ("r9", "escribe", "ADMINISTRADOR", "(0,N)", "NOTA_PEDIDO", "(1,1)"),
    ("r10", "cambia de precio", "RELOJ", "(0,N)", "HISTORIAL_PRECIO", "(1,1)"),
    ("r11", "autoriza", "ADMINISTRADOR", "(0,N)", "HISTORIAL_PRECIO", "(1,1)"),
    ("r12", "contiene", "DEPARTAMENTO", "(1,N)", "CIUDAD", "(1,1)"),
    ("r13", "recibe", "CIUDAD", "(0,N)", "PEDIDO", "(1,1)"),
]

# tablas del MR: (columna, tipo, marcas)  marcas: PK, FK, UQ, N (admite nulo)
MR = {
    "marca": [("id_marca", "INTEGER", "PK"), ("nombre", "VARCHAR(80)", "UQ")],
    "reloj": [("id_reloj", "INTEGER", "PK"), ("id_marca", "INTEGER", "FK"), ("nombre", "VARCHAR(150)", ""),
              ("genero", "VARCHAR(20)", ""), ("precio_cop", "BIGINT", ""), ("cantidad", "INTEGER", "N"),
              ("garantia", "VARCHAR(150)", ""), ("detalle_mecanica", "TEXT", "N"), ("descripcion", "TEXT", "N"),
              ("modo", "VARCHAR(12)", ""), ("visible", "BOOLEAN", ""), ("plazo_estimado", "VARCHAR(60)", "N"),
              ("url_amigable", "VARCHAR(160)", "UQ"), ("fecha_publicacion", "TIMESTAMPTZ", ""),
              ("fecha_actualizacion", "TIMESTAMPTZ", "")],
    "imagen_reloj": [("id_imagen", "INTEGER", "PK"), ("id_reloj", "INTEGER", "FK"), ("archivo", "VARCHAR(255)", ""),
                     ("orden", "SMALLINT", ""), ("es_principal", "BOOLEAN", "")],
    "estado_pedido": [("id_estado", "SMALLINT", "PK"), ("nombre", "VARCHAR(40)", "UQ")],
    "departamento": [("id_departamento", "SMALLINT", "PK"), ("codigo_dane", "CHAR(2)", "UQ"), ("nombre", "VARCHAR(60)", "")],
    "ciudad": [("id_ciudad", "INTEGER", "PK"), ("id_departamento", "SMALLINT", "FK"), ("codigo_dane", "CHAR(5)", "UQ"),
               ("nombre", "VARCHAR(80)", "")],
    "administrador": [("id_administrador", "INTEGER", "PK"), ("nombre", "VARCHAR(100)", ""), ("correo", "VARCHAR(254)", "UQ"),
                      ("contrasena_hash", "VARCHAR(255)", ""), ("intentos_fallidos", "SMALLINT", ""),
                      ("bloqueado_hasta", "TIMESTAMPTZ", "N"), ("fecha_creacion", "TIMESTAMPTZ", "")],
    "pedido": [("id_pedido", "INTEGER", "PK"), ("numero_pedido", "VARCHAR(20)", "UQ"), ("id_reloj", "INTEGER", "FK"),
               ("id_estado", "SMALLINT", "FK"), ("id_ciudad", "INTEGER", "FK"), ("nombre_reloj", "VARCHAR(150)", ""),
               ("precio_reloj", "BIGINT", ""), ("modo_reloj", "VARCHAR(12)", ""), ("nombre_comprador", "VARCHAR(120)", ""),
               ("telefono_comprador", "VARCHAR(10)", ""), ("direccion", "VARCHAR(250)", ""),
               ("fecha_autorizacion_datos", "TIMESTAMPTZ", ""), ("motivo_cancelacion", "VARCHAR(250)", "N"),
               ("clave_idempotencia", "VARCHAR(64)", "UQ N"), ("fecha_creacion", "TIMESTAMPTZ", "")],
    "historial_estado": [("id_historial", "INTEGER", "PK"), ("id_pedido", "INTEGER", "FK"), ("id_estado", "SMALLINT", "FK"),
                         ("id_administrador", "INTEGER", "FK N"), ("fecha_hora", "TIMESTAMPTZ", "")],
    "nota_pedido": [("id_nota", "INTEGER", "PK"), ("id_pedido", "INTEGER", "FK"), ("id_administrador", "INTEGER", "FK"),
                    ("texto", "VARCHAR(1000)", ""), ("fecha_hora", "TIMESTAMPTZ", "")],
    "historial_precio": [("id_cambio", "INTEGER", "PK"), ("id_reloj", "INTEGER", "FK"), ("id_administrador", "INTEGER", "FK"),
                         ("precio_anterior", "BIGINT", ""), ("precio_nuevo", "BIGINT", ""), ("fecha_hora", "TIMESTAMPTZ", "")],
    "enlace_contacto": [("id_enlace", "INTEGER", "PK"), ("tipo", "VARCHAR(15)", "UQ"), ("valor", "VARCHAR(255)", ""),
                        ("activo", "BOOLEAN", "")],
}
# claves foráneas del MR: (tabla_hija, columna, tabla_padre)
FK = [("reloj", "id_marca", "marca"), ("imagen_reloj", "id_reloj", "reloj"), ("ciudad", "id_departamento", "departamento"),
      ("pedido", "id_reloj", "reloj"), ("pedido", "id_estado", "estado_pedido"), ("pedido", "id_ciudad", "ciudad"),
      ("historial_estado", "id_pedido", "pedido"), ("historial_estado", "id_estado", "estado_pedido"),
      ("historial_estado", "id_administrador", "administrador"), ("nota_pedido", "id_pedido", "pedido"),
      ("nota_pedido", "id_administrador", "administrador"), ("historial_precio", "id_reloj", "reloj"),
      ("historial_precio", "id_administrador", "administrador")]

GRAPH = f'''  graph [fontname="{FONT}", bgcolor=white, pad=0.4, splines=true, nodesep=0.5, ranksep=1.0];
  node [fontname="{FONT}", fontsize=11, color="#111111", fontcolor="#111111"];
  edge [fontname="{FONT}", fontsize=10, color="#111111", fontcolor="#111111"];
'''


def render(name, body, dpi=150, engine="dot"):
    open(f"{name}.dot", "w", encoding="utf-8").write(body)
    subprocess.run([engine, "-Tpng", f"-Gdpi={dpi}", f"{name}.dot", "-o", f"{name}.png"], check=True)
    subprocess.run([engine, "-Tsvg", f"{name}.dot", "-o", f"{name}.svg"], check=True)


# ---------------------------------------------------------------- MER
def ent_html(name, attrs):
    rows = f'<tr><td bgcolor="#111111" align="center"><font color="white"><b>{name}</b></font></td></tr>'
    for i, a in enumerate(attrs):
        txt = f"<u><b>{a}</b></u>" if i == 0 else a
        rows += f'<tr><td align="left" port="{a}">{txt}</td></tr>'
    return f'<<table border="1" cellborder="0" cellspacing="0" cellpadding="3" bgcolor="white">{rows}</table>>'


b = "graph MER {\n  rankdir=TB;\n" + GRAPH.replace("nodesep=0.5, ranksep=1.0", "nodesep=0.35, ranksep=0.9")
b += '  labelloc=t; labeljust=l; fontsize=15; fontname="Liberation Sans Bold";\n'
b += '  label="MER de Omshato · Entidades, relaciones y cardinalidades (mínima, máxima)";\n'
b += '  node [shape=plaintext];\n'
for n, a in ENT.items():
    b += f"  {n} [label={ent_html(n, a)}];\n"
b += '  node [shape=diamond, style=filled, fillcolor="#F2F2F2", fontsize=10, width=1.3, height=0.8, margin="0.02,0.02"];\n'
for rid, nom, ea, ca, eb, cb in REL:
    b += f'  {rid} [label="{nom}"];\n'
for rid, nom, ea, ca, eb, cb in REL:
    b += f'  {ea} -- {rid} [taillabel="{ca}", labeldistance=2.3, labelangle=0, fontsize=10];\n'
    b += f'  {rid} -- {eb} [headlabel="{cb}", labeldistance=2.3, labelangle=0, fontsize=10];\n'
b += '  nota [shape=note, style=filled, fillcolor="#F2F2F2", fontsize=9.5, margin="0.15,0.1", label="Identificador subrayado. ENLACE_CONTACTO no se relaciona con otras entidades.\\nPEDIDO guarda nombre_reloj y precio_reloj del momento de la compra (RN-7).\\nHISTORIAL_ESTADO guarda solo el estado nuevo; el anterior es la fila previa del mismo pedido."];\n'
b += "}\n"
render("MER_modelo_entidad_relacion", b, dpi=140)

# ---------------------------------------------------------------- MR
def tabla_html(name, cols):
    rows = f'<tr><td colspan="3" bgcolor="#111111" align="center"><font color="white"><b>{name}</b></font></td></tr>'
    for c, t, m in cols:
        tags = m.split()
        key = "PK" if "PK" in tags else ("FK" if "FK" in tags else "")
        extra = " ".join(x for x in tags if x in ("UQ",))
        label = (key + (" " if key and extra else "") + extra).strip() or "&#160;"
        nm = f"<u><b>{c}</b></u>" if "PK" in tags else c
        if "N" in tags:
            nm += " ?"
        bg = ' bgcolor="#F2F2F2"' if "PK" in tags else ""
        rows += (f'<tr><td align="left"{bg}><font point-size="9">{label}</font></td>'
                 f'<td align="left" port="{c}"{bg}>{nm}</td><td align="left"{bg}><font point-size="9">{t}</font></td></tr>')
    return f'<<table border="1" cellborder="0" cellspacing="0" cellpadding="3" bgcolor="white">{rows}</table>>'


b = "digraph MR {\n  rankdir=TB;\n" + GRAPH.replace("nodesep=0.5, ranksep=1.0", "nodesep=0.6, ranksep=1.1")
b += '  labelloc=t; labeljust=l; fontsize=15; fontname="Liberation Sans Bold";\n'
b += '  label="MR de Omshato · Modelo relacional (tablas, claves primarias y foráneas)";\n'
b += "  node [shape=plaintext];\n"
for n, cols in MR.items():
    b += f"  {n} [label={tabla_html(n, cols)}];\n"
for hija, col, padre in FK:
    b += f'  {hija} -> {padre} [arrowtail=crow, arrowhead=tee, dir=both, arrowsize=0.9, taillabel="{col}", labeldistance=1.6, labelangle=25, fontsize=9];\n'
b += ('  leyenda [shape=note, style=filled, fillcolor="#F2F2F2", fontsize=9.5, margin="0.15,0.1", '
      'label="PK clave primaria (subrayada) · FK clave foránea · UQ valor único · ? admite nulo\\n'
      'La pata de gallo está en el lado que tiene la clave foránea (muchos) y la barra en el lado referenciado (uno)."];\n')
b += "}\n"
render("MR_modelo_relacional", b, dpi=140)
