"""Genera los diagramas C4 de Omshato (Graphviz). Uso: python3 c4.py  -> escribe .dot y renderiza PNG y SVG."""
import subprocess

FONT = "Liberation Sans"
HEAD = f'''  graph [fontname="{FONT}", bgcolor=white, pad=0.4, nodesep=0.7, ranksep=1.0, splines=true, compound=true];
  node [fontname="{FONT}", fontsize=11, shape=box, style="rounded,filled", margin="0.18,0.12", color="#111111", fontcolor="#111111", fillcolor=white, penwidth=1.4];
  edge [fontname="{FONT}", fontsize=10, color="#111111", fontcolor="#111111", arrowsize=0.8];
'''


def el(name, kind, desc, tech=None, width=None):
    """Etiqueta HTML con el formato de C4: nombre, [tipo] y descripción."""
    t = f"[{kind}" + (f": {tech}" if tech else "") + "]"
    d = desc.replace("\n", "<br/>")
    return (f'<<table border="0" cellborder="0" cellspacing="3"><tr><td><b><font point-size="13">{name}</font></b></td></tr>'
            f'<tr><td><font point-size="9">{t}</font></td></tr><tr><td><font point-size="10">{d}</font></td></tr></table>>')


def person(id_, name, desc):
    return f'  {id_} [label={el(name, "Persona", desc)}, fillcolor="#111111", fontcolor=white, shape=box];\n'.replace(
        "<table", '<table').replace('<font point-size="13">', '<font point-size="13" color="white">').replace(
        '<font point-size="9">', '<font point-size="9" color="white">').replace('<font point-size="10">', '<font point-size="10" color="white">')


def system(id_, name, desc, kind="Sistema de software"):
    return f'  {id_} [label={el(name, kind, desc)}, penwidth=2.6];\n'


def external(id_, name, desc, tech=None, kind="Sistema externo"):
    return f'  {id_} [label={el(name, kind, desc, tech)}, fillcolor="#E6E6E6", color="#555555"];\n'


def container(id_, name, tech, desc):
    return f'  {id_} [label={el(name, "Contenedor", desc, tech)}];\n'


def legend(items):
    rows = ""
    for fill, border, text, dashed in items:
        rows += (f'<tr><td width="26" height="16" bgcolor="{fill}" border="1" color="{border}"> </td>'
                 f'<td align="left"><font point-size="10">{text}</font></td></tr>')
    return (f'  leyenda [shape=plaintext, style="", label=<<table border="0" cellborder="0" cellspacing="4">'
            f'<tr><td colspan="2" align="left"><b><font point-size="10">Leyenda</font></b></td></tr>{rows}</table>>];\n')


def render(name, body):
    open(f"{name}.dot", "w", encoding="utf-8").write(body)
    subprocess.run(["dot", "-Tpng", "-Gdpi=170", f"{name}.dot", "-o", f"{name}.png"], check=True)
    subprocess.run(["dot", "-Tsvg", f"{name}.dot", "-o", f"{name}.svg"], check=True)


LEG = legend([("#111111", "#111111", "Persona", False), ("white", "#111111", "Sistema o contenedor propio", False),
              ("#E6E6E6", "#555555", "Sistema externo", False)])

# ------------------------------------------------------------------ C4 nivel 1: contexto
b = "digraph C4_contexto {\n  rankdir=TB;\n" + HEAD
b += '  labelloc=t; labeljust=l; fontsize=15; fontname="Liberation Sans Bold";\n'
b += '  label="C4 nivel 1 · Contexto del sistema Omshato";\n'
b += person("comprador", "Visitante o comprador", "Explora relojes y pide uno\nsin crear cuenta")
b += person("admin", "Administrador", "Gestiona el catálogo y los pedidos.\nEn la versión 1.0 es el cliente")
b += external("proveedor", "Proveedor de relojes", "Consigue los relojes Bajo pedido.\nNo usa el sistema", kind="Persona externa")
b += system("omshato", "Omshato", "Tienda web de relojes: catálogo público,\npedidos sin registro y panel de administración")
b += external("correo", "Servicio de correo", "Entrega el aviso de pedido nuevo\n(canal por definir, TBD-9)")
b += external("wa", "WhatsApp", "Chat directo con el negocio")
b += external("ig", "Instagram", "Perfil de la marca")
b += external("tt", "TikTok", "Perfil de la marca")
b += LEG
b += "  {rank=same; comprador; admin; proveedor;}\n  {rank=same; correo; wa; ig; tt;}\n"
b += '  comprador -> omshato [label="Explora el catálogo y\\nhace pedidos [HTTPS]"];\n'
b += '  admin -> omshato [label="Gestiona catálogo y pedidos\\n[HTTPS, con sesión]"];\n'
b += '  admin -> proveedor [style=dashed, label="Consigue los relojes por\\nfuera del sistema"];\n'
b += '  omshato -> correo [label="Envía aviso de\\npedido nuevo"];\n'
b += '  omshato -> wa [label="Enlaza a un chat\\n[URL, sin API]"];\n'
b += '  omshato -> ig [label="Enlaza al perfil\\n[URL]"];\n'
b += '  omshato -> tt [label="Enlaza al perfil\\n[URL]"];\n'
b += '  correo -> leyenda [style=invis];\n'
b += "}\n"
render("C4-1_contexto", b)

# ------------------------------------------------------------------ C4 nivel 2: contenedores
b = "digraph C4_contenedores {\n  rankdir=TB;\n" + HEAD
b += '  labelloc=t; labeljust=l; fontsize=15; fontname="Liberation Sans Bold";\n'
b += '  label="C4 nivel 2 · Contenedores del sistema Omshato";\n'
b += person("comprador", "Visitante o comprador", "Explora relojes y pide uno\nsin crear cuenta")
b += person("admin", "Administrador", "Gestiona el catálogo\ny los pedidos")
b += ('  subgraph cluster_omshato {\n    label=<<b>Omshato</b> [Sistema de software]>; labeljust=l; fontsize=13; style="rounded"; color="#111111"; penwidth=2.2; margin=24;\n')
b += "  " + container("app", "Aplicación web", "tecnología por definir, TBD-11",
                      "Sirve el sitio público y el panel de administración.\nAplica las reglas de negocio, valida datos,\nautentica al administrador y envía avisos")
b += "  " + container("db", "Base de datos", "relacional, recomendada",
                      "Relojes, marcas, pedidos, historial\ny cuentas de administrador")
b += "  " + container("img", "Almacenamiento de imágenes", "disco del servidor o servicio de objetos",
                      "Fotos de los relojes y sus\nversiones redimensionadas")
b += "  }\n"
b += external("correo", "Servicio de correo", "Entrega el aviso de pedido nuevo", "SMTP o API, TBD-9")
b += external("wa", "WhatsApp", "Chat directo con el negocio")
b += external("ig", "Instagram", "Perfil de la marca")
b += external("tt", "TikTok", "Perfil de la marca")
b += ('  nota [shape=note, style=filled, fillcolor="#F2F2F2", fontsize=9.5, margin="0.15,0.1", label="La tecnología se define en TBD-11. El sitio público\\ny el panel pueden desplegarse como una sola aplicación\\no como dos. Aquí se muestran juntos."];\n')
b += LEG
b += "  {rank=same; comprador; admin;}\n  {rank=same; correo; wa; ig; tt;}\n"
b += '  comprador -> app [label="Consulta el catálogo y\\nhace pedidos [HTTPS]"];\n'
b += '  admin -> app [label="Gestiona catálogo y pedidos\\n[HTTPS, con sesión]"];\n'
b += '  app -> db [label="Lee y escribe datos\\n[SQL]"];\n'
b += '  app -> img [label="Guarda y entrega fotos\\n[JPG, PNG, WebP]"];\n'
b += '  app -> correo [label="Envía aviso de pedido nuevo\\n[cifrado, asíncrono]"];\n'
b += '  app -> wa [label="Enlaza [URL]"];\n'
b += '  app -> ig [label="Enlaza [URL]"];\n'
b += '  app -> tt [label="Enlaza [URL]"];\n'
b += '  img -> nota [style=invis];\n  correo -> leyenda [style=invis];\n'
b += "}\n"
render("C4-2_contenedores", b)

# ------------------------------------------------------------------ C4 despliegue
def node_box(id_, name, tech, desc=None):
    d = f'<br/><font point-size="10">{desc.replace(chr(10), "<br/>")}</font>' if desc else ""
    return (f'    {id_} [label=<<b><font point-size="12">{name}</font></b><br/><font point-size="9">[{tech}]</font>{d}>];\n')

b = "digraph C4_despliegue {\n  rankdir=LR;\n" + HEAD
b += '  labelloc=t; labeljust=l; fontsize=15; fontname="Liberation Sans Bold";\n'
b += '  label="C4 · Diagrama de despliegue de Omshato (tecnología por definir, TBD-11)";\n'
b += ('  subgraph cluster_dev {\n    label=<<b>Dispositivo del usuario</b><br/><font point-size="9">[computador, tableta o celular, Android o iOS]</font>>; labeljust=l; style="rounded,filled"; fillcolor="#F7F7F7"; color="#111111"; margin=18;\n')
b += node_box("nav", "Navegador web", "Chrome, Edge, Firefox o Safari, últimas 2 versiones", "Sitio público y panel,\ndesde 360 px de ancho")
b += "  }\n"
b += ('  subgraph cluster_host {\n    label=<<b>Alojamiento web</b><br/><font point-size="9">[proveedor y sistema operativo por definir, HTTPS permanente]</font>>; labeljust=l; style="rounded,filled"; fillcolor="#F7F7F7"; color="#111111"; penwidth=2; margin=22;\n')
b += ('    subgraph cluster_srv {\n      label=<<b>Servidor de aplicación</b>>; style="rounded,filled"; fillcolor=white; color="#555555"; margin=14;\n')
b += "  " + node_box("app", "Aplicación web Omshato", "contenedor", "Sitio público, panel y reglas de negocio")
b += "    }\n"
b += ('    subgraph cluster_dbn {\n      label=<<b>Servidor de base de datos</b>>; style="rounded,filled"; fillcolor=white; color="#555555"; margin=14;\n')
b += "  " + node_box("db", "Base de datos Omshato", "relacional", "Relojes, pedidos, historial y cuentas")
b += "    }\n"
b += ('    subgraph cluster_fs {\n      label=<<b>Almacenamiento de archivos</b>>; style="rounded,filled"; fillcolor=white; color="#555555"; margin=14;\n')
b += "  " + node_box("img", "Imágenes de relojes", "disco o servicio de objetos", "JPG, PNG, WebP y versiones\nredimensionadas")
b += "    }\n"
b += node_box("bk", "Copias de seguridad automáticas", "tarea programada", "Al menos una diaria (SEF-1).\nSe prueba la restauración\nantes del lanzamiento")
b += "  }\n"
b += ('  subgraph cluster_mail {\n    label=<<b>Servicio de correo</b><br/><font point-size="9">[externo, TBD-9]</font>>; labeljust=l; style="rounded,filled"; fillcolor="#E6E6E6"; color="#555555"; margin=14;\n')
b += node_box("mail", "Servidor de correo", "SMTP o API", "Entrega el aviso de pedido nuevo")
b += "  }\n"
b += ('  subgraph cluster_git {\n    label=<<b>Repositorio Git</b>>; labeljust=l; style="rounded,filled"; fillcolor="#E6E6E6"; color="#555555"; margin=14;\n')
b += node_box("git", "Código fuente", "repositorio", "Con README de instalación\ny despliegue (CAL-6)")
b += "  }\n"
b += '  nav -> app [label="HTTPS\\nTLS 1.2 o superior"];\n'
b += '  app -> db [label="SQL"];\n'
b += '  app -> img [label="Archivos"];\n'
b += '  db -> bk [style=dashed, label="respaldo"];\n'
b += '  img -> bk [style=dashed, label="respaldo"];\n'
b += '  app -> mail [label="Aviso de pedido\\n[cifrado]"];\n'
b += '  git -> app [style=dashed, label="Despliegue"];\n'
b += "}\n"
render("C4-3_despliegue", b)
