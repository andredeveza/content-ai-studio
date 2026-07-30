import { z } from "zod";

const HexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor precisa ser um hex de 6 dígitos");

const FontRefSchema = z.object({
  family: z.string().trim().min(1),
  weights: z.array(z.number().int().positive()).min(1),
});

const PaletteSchema = z.object({
  ink: HexColor,
  graphite: HexColor,
  slate: HexColor,
  gray: HexColor,
  title: HexColor,
  brand: HexColor,
  primary: HexColor,
  accent: HexColor,
  loud: HexColor,
  bgLight: HexColor,
  panelLight: HexColor,
  titleLight: HexColor,
  textLight: HexColor,
});

const FontsSchema = z.object({
  display: FontRefSchema,
  body: FontRefSchema,
  mono: FontRefSchema,
  editorial: FontRefSchema.optional(),
});

const ChromeSchema = z.object({
  top: z.array(z.string().trim().min(1)).min(1),
  footer: z.string().trim().min(1),
  footerLast: z.string().trim().min(1),
});

// `neonMaxArea` e `blurTextForbidden` são literais fixos: são regras da
// marca não negociáveis (README, seção "Brand Kit"), não configuração.
const RulesSchema = z.object({
  neonMaxArea: z.literal("detail"),
  alternateModes: z.boolean(),
  blurTextForbidden: z.literal(true),
});

export const UpsertBrandKitSchema = z.object({
  palette: PaletteSchema,
  gradient: z.string().trim().min(1),
  fonts: FontsSchema,
  chrome: ChromeSchema,
  rules: RulesSchema,
  imageStyle: z.string().trim().min(1).nullable().default(null),
  cta: z.string().trim().min(1),
  style: z.string().trim().min(1).nullable().default(null),
});

// z.input: `imageStyle` e `style` têm `.default(null)` mas continuam
// opcionais para quem chama o use-case.
export type UpsertBrandKitInput = z.input<typeof UpsertBrandKitSchema>;
