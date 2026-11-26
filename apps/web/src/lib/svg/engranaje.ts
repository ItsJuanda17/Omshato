/**
 * Geometría de engranajes para los SVG decorativos.
 * Los trazos se calculan una sola vez y se dibujan con línea fina, sin relleno.
 */

type Punto = readonly [number, number];

function polar(radio: number, angulo: number): Punto {
  return [radio * Math.cos(angulo), radio * Math.sin(angulo)];
}

function fmt([x, y]: Punto) {
  return `${x.toFixed(2)} ${y.toFixed(2)}`;
}

export interface RadiosEngranaje {
  /** Radio de paso: el que debe coincidir entre dos engranajes que engranan. */
  paso: number;
  exterior: number;
  raiz: number;
}

/** Radios para un engranaje de `dientes` dientes con el módulo dado (distancia de paso / π). */
export function radiosEngranaje(dientes: number, modulo: number): RadiosEngranaje {
  const paso = (modulo * dientes) / 2;
  return { paso, exterior: paso + modulo * 0.75, raiz: paso - modulo * 0.875 };
}

/** Contorno de un engranaje recto de perfil trapezoidal, centrado en el origen. */
export function trazoEngranaje(dientes: number, { exterior, raiz }: RadiosEngranaje) {
  const paso = (Math.PI * 2) / dientes;
  const comandos: string[] = [];

  for (let i = 0; i < dientes; i++) {
    const centro = i * paso;
    const inicioRaiz = polar(raiz, centro - paso * 0.3);
    const inicioCima = polar(exterior, centro - paso * 0.17);
    const finCima = polar(exterior, centro + paso * 0.17);
    const finRaiz = polar(raiz, centro + paso * 0.3);

    comandos.push(i === 0 ? `M${fmt(inicioRaiz)}` : `A${raiz} ${raiz} 0 0 1 ${fmt(inicioRaiz)}`);
    comandos.push(`L${fmt(inicioCima)}`);
    comandos.push(`A${exterior} ${exterior} 0 0 1 ${fmt(finCima)}`);
    comandos.push(`L${fmt(finRaiz)}`);
  }

  comandos.push(`A${raiz} ${raiz} 0 0 1 ${fmt(polar(raiz, -paso * 0.3))}Z`);
  return comandos.join("");
}

/** Contorno de una rueda de escape: dientes de sierra que avanzan en un solo sentido. */
export function trazoRuedaEscape(dientes: number, exterior: number, raiz: number) {
  const paso = (Math.PI * 2) / dientes;
  const comandos: string[] = [];

  for (let i = 0; i < dientes; i++) {
    const inicio = i * paso;
    const raizInicial = polar(raiz, inicio);
    const punta = polar(exterior, inicio + paso * 0.82);
    const raizFinal = polar(raiz, inicio + paso * 0.9);

    comandos.push(i === 0 ? `M${fmt(raizInicial)}` : `A${raiz} ${raiz} 0 0 1 ${fmt(raizInicial)}`);
    comandos.push(`L${fmt(punta)}`);
    comandos.push(`L${fmt(raizFinal)}`);
  }

  comandos.push(`A${raiz} ${raiz} 0 0 1 ${fmt(polar(raiz, 0))}Z`);
  return comandos.join("");
}

/** Segmentos que unen el cubo con el aro interior, repartidos a partes iguales. */
export function brazos(cantidad: number, desde: number, hasta: number, desfase = 0) {
  return Array.from({ length: cantidad }, (_, i) => {
    const angulo = desfase + (i * Math.PI * 2) / cantidad;
    return { desde: polar(desde, angulo), hasta: polar(hasta, angulo) };
  });
}
