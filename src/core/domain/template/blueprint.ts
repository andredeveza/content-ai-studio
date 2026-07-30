export type ArchetypeId =
  | "cover-centro"
  | "numerada"
  | "citacao"
  | "dado"
  | "foto-total"
  | "lista-icone"
  | "evento"
  | "fecho";

export interface Canvas {
  readonly w: number;
  readonly h: number;
}

export interface SlotBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

// Papel semântico da cor no Brand Kit (README, "Brand Kit — modelo de
// dados" > `palette`). O blueprint só referencia o papel; a cor concreta
// vem do Brand Kit injetado em tempo de render — regra não negociável nº1.
export type ColorRole =
  | "ink"
  | "graphite"
  | "slate"
  | "gray"
  | "title"
  | "brand"
  | "primary"
  | "accent"
  | "loud"
  | "bgLight"
  | "panelLight"
  | "titleLight"
  | "textLight";

export type FontRole = "display" | "body" | "mono" | "editorial";

export interface TextSlot {
  readonly kind: "text";
  readonly key: string;
  readonly box: SlotBox;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly tracking?: string;
  readonly weight?: number;
  readonly font?: FontRole;
  readonly color?: ColorRole;
  readonly align?: "left" | "center";
  // Conteúdo fixo (ex.: glifo de aspas da citação) — ignora
  // `content.texts[key]` e sempre renderiza este texto.
  readonly staticText?: string;
  // Pílula de CTA (ex.: botão do "fecho"): fundo sólido + raio.
  readonly background?: ColorRole;
  readonly radius?: number;
  // Sobrescreve o número de linhas do clamp calculado automaticamente a
  // partir de box.h / lineHeight (regra de clamp obrigatória, README).
  readonly maxLinesOverride?: number;
}

export interface MediaSlot {
  readonly kind: "media";
  readonly key: string;
  readonly box: SlotBox;
  // true = a imagem sangra por baixo do chrome de propósito (ex.: capa de
  // "foto-total"); false = a imagem fica confinada à própria box.
  readonly bleed?: boolean;
}

export interface ShapeSlot {
  readonly kind: "shape";
  readonly key: string;
  readonly box: SlotBox;
  readonly color?: ColorRole;
  readonly opacity?: number;
  readonly radius?: number;
}

// Véu gradiente sobre mídia (ex.: base de "foto-total") para garantir
// contraste do texto ancorado por cima — cor computada real (Acervo/RAG)
// só chega no bloco 7; aqui é um gradiente fixo transparente → `toColor`.
export interface ScrimSlot {
  readonly kind: "scrim";
  readonly key: string;
  readonly box: SlotBox;
  readonly toColor?: ColorRole;
  readonly toOpacity?: number;
}

// Placeholder decorativo (ex.: barras do "dado") — não há ChartService
// ainda; a geometria reserva o espaço, o valor real é trabalho futuro.
export interface ChartBarSlot {
  readonly kind: "chart-bar";
  readonly key: string;
  readonly box: SlotBox;
  readonly color?: ColorRole;
  readonly radius?: number;
}

export type Slot = TextSlot | MediaSlot | ShapeSlot | ScrimSlot | ChartBarSlot;

export interface Blueprint {
  readonly id: ArchetypeId;
  readonly name: string;
  readonly role: string;
  // Geometria em função de H (README: "toda posição vertical é derivada
  // de H — nunca absoluta").
  readonly slots: (canvas: Canvas) => readonly Slot[];
}
