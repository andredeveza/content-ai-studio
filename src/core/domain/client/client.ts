export interface Client {
  readonly id: string;
  readonly orgId: string;
  readonly name: string;
  readonly handles: readonly string[];
  readonly persona: string | null;
  readonly tone: readonly string[];
  readonly goals: readonly string[];
  readonly specialties: readonly string[];
  readonly site: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NewClient {
  readonly orgId: string;
  readonly name: string;
  readonly handles?: readonly string[];
  readonly persona?: string | null;
  readonly tone?: readonly string[];
  readonly goals?: readonly string[];
  readonly specialties?: readonly string[];
  readonly site?: string | null;
}

export interface ClientPatch {
  readonly name?: string;
  readonly handles?: readonly string[];
  readonly persona?: string | null;
  readonly tone?: readonly string[];
  readonly goals?: readonly string[];
  readonly specialties?: readonly string[];
  readonly site?: string | null;
}
