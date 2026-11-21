"""Genera los diagramas de casos de uso de Omshato (blanco y negro, posiciones manuales).
Uso:  python3 casos_de_uso.py     -> crea los PNG y SVG en la carpeta actual.
"""
import math
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse, FancyBboxPatch, Polygon

plt.rcParams["font.family"] = ["Liberation Sans", "DejaVu Sans"]
plt.rcParams["svg.fonttype"] = "path"
INK, GRAY = "#111111", "#F2F2F2"


class Diagram:
    def __init__(self, w, h, xlim, ylim):
        self.fig = plt.figure(figsize=(w, h), dpi=200)
        self.ax = self.fig.add_axes([0, 0, 1, 1])
        self.ax.set_xlim(*xlim)
        self.ax.set_ylim(*ylim)
        self.ax.set_aspect("equal")
        self.ax.axis("off")
        self.uc = {}

    def boundary(self, x0, y0, x1, y1, title):
        self.ax.add_patch(FancyBboxPatch((x0, y0), x1 - x0, y1 - y0,
                          boxstyle="round,pad=0,rounding_size=0.25", fill=False, ec=INK, lw=1.8))
        self.ax.text(x0 + 0.3, y1 - 0.4, title, fontsize=13, fontweight="bold", va="center", ha="left", color=INK)

    def usecase(self, key, x, y, text, gray=False, a=1.75, b=0.5):
        self.ax.add_patch(Ellipse((x, y), 2 * a, 2 * b, fc=GRAY if gray else "white", ec=INK, lw=1.3, zorder=3))
        lines = text.split("\n")
        step = 0.27
        y0 = y + step * (len(lines) - 1) / 2
        for i, ln in enumerate(lines):
            self.ax.text(x, y0 - i * step, ln, fontsize=9.5, fontweight="bold" if i == 0 else "normal",
                         ha="center", va="center", zorder=4, color=INK)
        self.uc[key] = (x, y, a, b)

    def actor(self, key, x, y, label, sub=None):
        k = dict(color=INK, lw=2.0, solid_capstyle="round", zorder=3)
        ax = self.ax
        ax.add_patch(plt.Circle((x, y + 1.05), 0.28, fc="white", ec=INK, lw=2.0, zorder=3))
        ax.plot([x, x], [y + 0.77, y + 0.1], **k)
        ax.plot([x - 0.42, x + 0.42], [y + 0.58, y + 0.58], **k)
        ax.plot([x, x - 0.36], [y + 0.1, y - 0.5], **k)
        ax.plot([x, x + 0.36], [y + 0.1, y - 0.5], **k)
        t = label + (("\n" + sub) if sub else "")
        ax.text(x, y - 0.72, t, fontsize=10, ha="center", va="top", color=INK, linespacing=1.2)
        self.uc[key] = (x, y + 0.45, 0.5, 0.5)

    @staticmethod
    def _edge(c, toward):
        x, y, a, b = c
        dx, dy = toward[0] - x, toward[1] - y
        t = 1.0 / math.sqrt((dx / a) ** 2 + (dy / b) ** 2)
        return x + dx * t, y + dy * t

    def assoc(self, k1, k2, left=False):
        c1, c2 = self.uc[k1], self.uc[k2]
        if left:  # el actor llega siempre a la punta izquierda del caso de uso
            p2 = (c2[0] - c2[2], c2[1])
            p1 = (c1[0] + 0.6, c1[1] + 0.05)
        else:
            p1 = self._edge(c1, (c2[0], c2[1]))
            p2 = self._edge(c2, (c1[0], c1[1]))
        self.ax.plot([p1[0], p2[0]], [p1[1], p2[1]], color=INK, lw=1.1, zorder=2)

    def rel(self, src, dst, label, lx=0.0, ly=0.0):
        c1, c2 = self.uc[src], self.uc[dst]
        p1 = self._edge(c1, (c2[0], c2[1]))
        p2 = self._edge(c2, (c1[0], c1[1]))
        self.ax.annotate("", xy=p2, xytext=p1, zorder=2,
                         arrowprops=dict(arrowstyle="->", lw=1.1, ls=(0, (4, 3)), color=INK, shrinkA=0, shrinkB=0))
        mx, my = (p1[0] + p2[0]) / 2 + lx, (p1[1] + p2[1]) / 2 + ly
        self.ax.text(mx, my, label, fontsize=8.5, ha="center", va="center", zorder=5, color=INK,
                     bbox=dict(fc="white", ec="none", pad=1.2))

    def note(self, x, y, text, w=4.6, h=0.9):
        pts = [(x, y), (x + w - 0.3, y), (x + w, y - 0.3), (x + w, y - h), (x, y - h)]
        self.ax.add_patch(Polygon(pts, closed=True, fc=GRAY, ec=INK, lw=1.0, zorder=3))
        self.ax.text(x + 0.15, y - h / 2, text, fontsize=8.5, ha="left", va="center", color=INK, zorder=4, linespacing=1.2)

    def save(self, name):
        self.fig.savefig(name + ".png", dpi=200, facecolor="white")
        self.fig.savefig(name + ".svg", facecolor="white")
        plt.close(self.fig)


# ---------------------------------------------------------------- CU-01 comprador
d = Diagram(11.5, 9.2, (0, 14.4), (-1.0, 11.2))
d.boundary(2.9, -0.7, 10.9, 10.9, "Sistema Omshato · Sitio público")
d.actor("comp", 1.2, 4.6, "Visitante\no comprador")
d.actor("redes", 12.7, 8.2, "WhatsApp, Instagram\ny TikTok", "«sistemas externos»")
d.actor("notif", 12.7, 3.6, "Canal de notificación", "«sistema externo»\n(correo o WhatsApp, TBD-9)")

X = 5.5
d.usecase("c06", X, 9.6, "CU-06\nVisitar redes sociales")
d.usecase("c05", X, 8.1, "CU-05\nConsultar por WhatsApp")
d.usecase("c03", X, 6.6, "CU-03\nVer ficha de un reloj")
d.usecase("c04", X, 5.1, "CU-04\nHacer pedido sin registro")
d.usecase("c01", X, 3.3, "CU-01\nVer catálogo de relojes")
d.usecase("c02", X, 1.8, "CU-02\nFiltrar y buscar relojes")
d.usecase("c07", X, 0.2, "CU-07\nConsultar información\nlegal y ayuda", b=0.6)
d.usecase("c08", 9.0, 3.4, "CU-08\nAceptar política de\ndatos personales", gray=True, a=1.6, b=0.6)
d.usecase("c09", 9.0, 5.9, "CU-09\nNotificar pedido nuevo\nal administrador", gray=True, a=1.6, b=0.6)

for k in ("c06", "c05", "c03", "c04", "c01", "c02", "c07"):
    d.assoc("comp", k, left=True)
d.assoc("c09", "notif")
d.assoc("c06", "redes")
d.assoc("c05", "redes")
d.rel("c05", "c03", "«extend»", lx=1.1)
d.rel("c04", "c03", "«extend»", lx=1.1)
d.rel("c02", "c01", "«extend»", lx=1.1)
d.rel("c04", "c09", "«include»", ly=0.32, lx=-0.1)
d.rel("c04", "c08", "«include»", ly=-0.2)
d.save("CU-01_casos_de_uso_comprador")

# ---------------------------------------------------------------- CU-02 administrador
d = Diagram(11.5, 14.4, (0, 15.4), (-6.0, 13.6))
d.boundary(2.9, -5.6, 13.0, 13.3, "Sistema Omshato · Panel de administración")
d.actor("adm", 1.2, 3.0, "Administrador")
d.actor("wa", 14.3, -3.3, "WhatsApp", "«sistema externo»")
d.note(8.7, 13.0, "Todos los casos de uso, salvo CU-10,\nrequieren una sesión activa (REQ-AUT-1).", w=4.1, h=0.9)

X = 5.3
rows = [("c10", 11.4, "CU-10\nIniciar sesión"),
        ("c11", 10.15, "CU-11\nCerrar sesión"),
        ("c12", 8.9, "CU-12\nCambiar contraseña"),
        ("c13", 7.3, "CU-13\nAgregar reloj"),
        ("c14", 6.05, "CU-14\nEditar reloj"),
        ("c16", 4.8, "CU-16\nOcultar o mostrar reloj"),
        ("c17", 3.55, "CU-17\nEliminar reloj"),
        ("c19", 1.95, "CU-19\nListar y filtrar pedidos"),
        ("c20", 0.7, "CU-20\nVer detalle de un pedido"),
        ("c21", -0.55, "CU-21\nCambiar estado de un pedido"),
        ("c23", -1.8, "CU-23\nAgregar nota interna"),
        ("c24", -3.2, "CU-24\nContactar al comprador\npor WhatsApp"),
        ("c25", -4.7, "CU-25\nEditar enlaces de contacto")]
for k, y, t in rows:
    d.usecase(k, X, y, t, a=1.95, b=0.5 if t.count("\n") == 1 else 0.62)
d.usecase("c18", 9.9, 6.7, "CU-18\nSubir y ordenar fotos", gray=True, a=1.6)
d.usecase("c15", 9.9, 4.6, "CU-15\nCambiar modo: Disponible\no Bajo pedido", a=1.8, b=0.62)
d.usecase("c22", 9.9, -0.3, "CU-22\nCancelar pedido\n(con motivo)", a=1.6, b=0.62)
d.usecase("c26", 10.6, 2.4, "CU-26\nConfirmar acción\ndestructiva", gray=True, a=1.55, b=0.62)

for k in ("c10", "c11", "c12", "c13", "c14", "c16", "c17", "c19", "c20", "c21", "c23", "c24", "c25"):
    d.assoc("adm", k, left=True)
d.assoc("c24", "wa")
d.rel("c15", "c14", "«extend»", lx=0.9, ly=-0.1)
d.rel("c22", "c21", "«extend»", ly=-0.25)
d.rel("c13", "c18", "«include»", ly=0.22)
d.rel("c14", "c18", "«include»", ly=-0.22)
d.rel("c17", "c26", "«include»", ly=0.2)
d.rel("c22", "c26", "«include»", lx=0.7)
d.save("CU-02_casos_de_uso_administrador")
