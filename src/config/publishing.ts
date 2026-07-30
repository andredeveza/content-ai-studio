export type PublishingChannel = "export" | "postiz" | "instagram";

export interface PublishingConfig {
  readonly channels: Record<PublishingChannel, { enabled: boolean }>;
}

// No MVP só `export` (zip com PNGs + legenda) está ligado — README, seção
// "Publicação". Os demais entram quando houver aprovação de terceiro.
export const publishingConfig: PublishingConfig = {
  channels: {
    export: { enabled: true },
    postiz: { enabled: false },
    instagram: { enabled: false },
  },
};
