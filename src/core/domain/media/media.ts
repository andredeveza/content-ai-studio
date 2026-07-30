export interface Media {
  readonly id: string;
  readonly orgId: string;
  readonly path: string;
  readonly kind: string;
  readonly width: number;
  readonly height: number;
  readonly provider: string | null;
  readonly promptId: string | null;
  readonly createdAt: string;
}

export interface NewMedia {
  readonly orgId: string;
  readonly path: string;
  readonly kind: string;
  readonly width: number;
  readonly height: number;
  readonly provider?: string | null;
  readonly promptId?: string | null;
}
