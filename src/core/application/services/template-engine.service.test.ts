import { describe, expect, it } from "vitest";
import { TemplateEngineService } from "@/core/application/services/template-engine.service";
import { ALL_ARCHETYPE_IDS, getBlueprint } from "@/templates/blueprints";
import { blueprintContext, contextForStyle } from "@/templates/context";
import { band } from "@/templates/geometry";
import { computeClamp } from "@/templates/clamp";
import type { BrandKit } from "@/core/domain/brandkit/brand-kit";
import type { SlideContent } from "@/core/domain/template/slide-content";

const CANVAS = { w: 1080, h: 1350 };

const ABSURDLY_LONG_TEXT =
  "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ".repeat(
    30,
  );

const brandKit: BrandKit = {
  id: "brandkit-1",
  clientId: "client-1",
  palette: {
    ink: "#06070A",
    graphite: "#101319",
    slate: "#1B212B",
    gray: "#8B94A3",
    title: "#EEF1F6",
    brand: "#0A47A8",
    primary: "#1C7ED6",
    accent: "#57A8FF",
    loud: "#1C4FE0",
    bgLight: "#FFFFFF",
    panelLight: "#F4F6FA",
    titleLight: "#0A0C10",
    textLight: "#5A6474",
  },
  gradient: "linear-gradient(135deg, #0A47A8, #1C7ED6 55%, #57A8FF)",
  fonts: {
    display: {
      family: "Satoshi",
      weights: [700, 900],
      cssUrl: "https://api.fontshare.com/v2/css?f[]=satoshi@700,900&f[]=general-sans@400,500&display=swap",
    },
    body: {
      family: "General Sans",
      weights: [400, 500],
      cssUrl: "https://api.fontshare.com/v2/css?f[]=satoshi@700,900&f[]=general-sans@400,500&display=swap",
    },
    mono: {
      family: "JetBrains Mono",
      weights: [400, 500],
      cssUrl: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap",
    },
  },
  logo: { path: null, radius: 0 },
  chrome: {
    top: ["@trafegodigitalad", "AD TRÁFEGO DIGITAL", "©2026"],
    footer: "✦ ARRASTE PARA O LADO →",
    footerLast: "SALVE ESTE POST",
  },
  rules: { neonMaxArea: "detail", alternateModes: true, blurTextForbidden: true },
  imageStyle: null,
  cta: "Fale com a gente",
  style: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function buildAbsurdContent(archetypeId: (typeof ALL_ARCHETYPE_IDS)[number]): SlideContent {
  const slots = getBlueprint(archetypeId).slots(blueprintContext(CANVAS));
  const texts: Record<string, string> = {};
  const media: Record<string, string> = {};

  for (const slot of slots) {
    if (slot.kind === "text" && !slot.staticText) texts[slot.key] = ABSURDLY_LONG_TEXT;
    if (slot.kind === "media") media[slot.key] = "https://example.com/foto.jpg";
  }

  return { texts, media };
}

describe("TemplateEngineService (bloco 4) — regra de clamp obrigatória", () => {
  const engine = new TemplateEngineService();

  for (const id of ALL_ARCHETYPE_IDS) {
    it(`"${id}": texto absurdamente longo em todo slot não invade o chrome`, () => {
      const content = buildAbsurdContent(id);
      const html = engine.render(getBlueprint(id), CANVAS, content, brandKit, { isLastSlide: false });

      const slotDivs = [...html.matchAll(/<div data-slot="([^"]+)" data-max-lines="(\d+)" data-max-height="(\d+)" style="([^"]*)"/g)];
      const textSlots = getBlueprint(id).slots(blueprintContext(CANVAS)).filter((slot) => slot.kind === "text");

      expect(slotDivs.length).toBe(textSlots.length);

      const contentBand = band(CANVAS.h);

      for (const slot of textSlots) {
        const match = slotDivs.find((m) => m[1] === slot.key);
        expect(match, `slot "${slot.key}" não encontrado no HTML gerado`).toBeTruthy();
        if (!match) continue;

        const maxLines = Number(match[2]);
        const maxHeightPx = Number(match[3]);
        const style = match[4];

        const expectedClamp = computeClamp(slot.box.h, slot.lineHeight, slot.maxLinesOverride);
        expect(maxLines).toBe(expectedClamp.maxLines);
        expect(maxHeightPx).toBe(expectedClamp.maxHeightPx);

        // A altura máxima renderizável nunca pode ultrapassar a altura do
        // próprio slot — é isso que impede o texto de vazar para fora da
        // sua box e, por construção geométrica (blueprints.test.ts),
        // nenhuma box de conteúdo invade a faixa de chrome.
        expect(maxHeightPx).toBeLessThanOrEqual(slot.box.h);
        expect(slot.box.y + maxHeightPx).toBeLessThanOrEqual(contentBand.bottom);

        expect(style).toContain("overflow:hidden");
        expect(style).toContain(`-webkit-line-clamp:${maxLines}`);
        expect(style).toContain(`max-height:${maxHeightPx}px`);
      }
    });
  }

  it("troca o rodapé para footerLast no último slide", () => {
    const id = "fecho";
    const content = buildAbsurdContent(id);
    const html = engine.render(getBlueprint(id), CANVAS, content, brandKit, { isLastSlide: true });
    expect(html).toContain("SALVE ESTE POST");
    expect(html).not.toContain("ARRASTE PARA O LADO");
  });

  it("mantém o rodapé padrão quando não é o último slide", () => {
    const id = "fecho";
    const content = buildAbsurdContent(id);
    const html = engine.render(getBlueprint(id), CANVAS, content, brandKit, { isLastSlide: false });
    expect(html).toContain("ARRASTE PARA O LADO");
    expect(html).not.toContain("SALVE ESTE POST");
  });

  it("injeta <link> para as fontes do Brand Kit que têm cssUrl, sem duplicar URLs repetidas", () => {
    const id = "cover-centro";
    const content: SlideContent = { texts: { kicker: "k", heading: "h", lead: "l" } };
    const html = engine.render(getBlueprint(id), CANVAS, content, brandKit);

    expect(html).toContain(
      '<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@700,900&amp;f[]=general-sans@400,500&amp;display=swap">',
    );
    expect(html).toContain(
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&amp;display=swap">',
    );
    expect(html.match(/api\.fontshare\.com/g)?.length).toBe(1);
  });

  it("não injeta nenhum <link> quando nenhuma fonte do Brand Kit declara cssUrl", () => {
    const id = "cover-centro";
    const content: SlideContent = { texts: { kicker: "k", heading: "h", lead: "l" } };
    const brandKitSemCssUrl: BrandKit = {
      ...brandKit,
      fonts: {
        display: { family: "Satoshi", weights: [700, 900] },
        body: { family: "General Sans", weights: [400, 500] },
        mono: { family: "JetBrains Mono", weights: [400, 500] },
      },
    };
    const html = engine.render(getBlueprint(id), CANVAS, content, brandKitSemCssUrl);
    expect(html).not.toContain("<link rel=\"stylesheet\"");
  });

  it("escapa HTML do conteúdo para não quebrar o layout", () => {
    const id = "cover-centro";
    const content: SlideContent = {
      texts: { kicker: "<script>alert(1)</script>", heading: "Título", lead: "Apoio" },
    };
    const html = engine.render(getBlueprint(id), CANVAS, content, brandKit);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

// A razão de existir da camada de estilos: o MESMO conteúdo, no mesmo
// arquétipo, tem que sair visualmente diferente conforme o estilo. Se
// este teste passar a falhar, os estilos viraram decoração de novo.
describe("estilos de composição afetam o HTML de verdade", () => {
  const engine = new TemplateEngineService();
  const canvas = { w: 1080, h: 1350 };
  const content = { texts: { kicker: "kicker", heading: "Uma manchete de teste", lead: "apoio" }, media: {} };

  function render(styleSlug: string) {
    return engine.render(getBlueprint("cover-centro"), canvas, content, brandKit, {
      context: contextForStyle(canvas, styleSlug, null),
    });
  }

  it("margem e escala do estilo mudam a geometria emitida", () => {
    // 01 "manchete sangrada": margem 36 e display 128–148, contra a
    // margem 80 / display 110 do estilo neutro.
    expect(render("manchete-sangrada")).not.toBe(render("nevoa-suave"));
    expect(render("manchete-sangrada")).toContain("left:36px");
    expect(render("grade-silenciosa")).toContain("left:96px");
  });

  it("ornamento declarativo do estilo é renderizado como fundo", () => {
    // 06 "névoa suave": 3 manchas blur 60px.
    const nevoa = render("nevoa-suave");
    expect(nevoa.match(/data-decor="blob"/g)).toHaveLength(3);
    expect(nevoa).toContain("blur(60px)");

    // 07 "grade silenciosa": 4 colunas fixas.
    expect(render("grade-silenciosa").match(/data-decor="guide"/g)).toHaveLength(4);

    // 04 "fio de thread": cartão 968×1170 r=34.
    const thread = render("fio-de-thread");
    expect(thread).toContain('data-decor="card"');
    expect(thread).toContain("width:968px");
    expect(thread).toContain("border-radius:34px");
  });

  it("o selo do estilo 08 aparece só nele", () => {
    expect(render("capa-de-campanha")).toContain("conteúdo na legenda");
    expect(render("nevoa-suave")).not.toContain("data-badge");
  });

  it("o ornamento vem antes dos slots — é fundo, nunca cobre o conteúdo", () => {
    const html = render("nevoa-suave");
    expect(html.indexOf('data-decor="blob"')).toBeLessThan(html.indexOf('data-slot="heading"'));
  });
});
