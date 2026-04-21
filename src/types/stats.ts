export type StatsMetric = {
  key: string;
  value: number;
};

export type StatsMetricDefinition = {
  key: string;
  label: string;
  unit?: string;
  format?: "integer" | "decimal" | "currency_usd" | "currency_cents_usd" | "percentage";
  category?: string;
  order?: number;
};

export type StatsPayload = {
  recorded_at?: string;
  metrics: StatsMetric[];
  definitions?: StatsMetricDefinition[];
};
