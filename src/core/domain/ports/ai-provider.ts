export type Capability = "text" | "image" | "vision" | "embed";

export interface TextInput {
  readonly prompt: string;
  readonly system?: string;
  readonly maxTokens?: number;
  readonly temperature?: number;
}

export interface TextOutput {
  readonly text: string;
  readonly model: string;
  readonly tokensInput: number;
  readonly tokensOutput: number;
}

export interface ImageInput {
  readonly prompt: string;
  readonly width?: number;
  readonly height?: number;
}

export interface ImageOutput {
  readonly imageUrl: string;
  readonly model: string;
}

export interface VisionInput {
  readonly imageUrl: string;
  readonly prompt: string;
}

export interface VisionOutput {
  readonly text: string;
  readonly model: string;
}

export interface EmbedInput {
  readonly text: string;
}

export interface EmbedOutput {
  readonly embedding: readonly number[];
  readonly model: string;
}

export interface AIProvider {
  readonly id: string;
  readonly capabilities: readonly Capability[];
  generateText(input: TextInput): Promise<TextOutput>;
  generateImage(input: ImageInput): Promise<ImageOutput>;
  analyzeImage(input: VisionInput): Promise<VisionOutput>;
  embed(input: EmbedInput): Promise<EmbedOutput>;
  healthcheck(): Promise<boolean>;
}
