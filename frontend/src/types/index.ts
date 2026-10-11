export interface SystemStatus {
  dataset_loaded: boolean;
  dataset_name: string | null;
  dataset_records_count: number;
  dataset_features_count: number;
  dataset_classes_count: number;
  loaded_models_count: number;
  active_model_name: string | null;
  anomaly_detector_ready: boolean;
  system_timestamp: string;
}

export interface DatasetProfile {
  source_name: string;
  rows_count: number;
  columns_count: number;
  duplicate_rows: number;
  duplicate_percentage: float;
  target_column: string | null;
  target_distribution: Record<string, { count: number; percentage: number }>;
  numeric_feature_count: number;
  categorical_feature_count: number;
  numeric_features: string[];
  categorical_features: string[];
  missing_summary: Record<string, { missing_count: number; missing_percentage: number; dtype: string }>;
  infinite_values_count: number;
  numeric_summary: Record<string, { mean: number; std: number; min: number; q25: number; median: number; q75: number; max: number }>;
  categorical_summary: Record<string, { unique_count: number; top_categories: Record<string, number> }>;
  top_correlations: Array<{ feature_a: string; feature_b: string; correlation: number }>;
  warnings_count: number;
  warnings: string[];
}

type float = number;

export interface FlowRecord {
  [key: string]: any;
}

export interface RecordsPageData {
  total_records: number;
  page: number;
  page_size: number;
  total_pages: number;
  records: FlowRecord[];
}

export interface ModelSummary {
  model_id: string;
  model_name: string;
  model_type: string;
  accuracy: number;
  macro_f1: number;
  weighted_f1: number;
  saved_at?: string;
  is_active: boolean;
}

export interface ConfusionMatrixData {
  labels: string[];
  matrix: number[][];
}

export interface ModelMetricsDetail {
  accuracy: number;
  balanced_accuracy: number;
  macro_precision: number;
  macro_recall: number;
  macro_f1: number;
  weighted_precision: number;
  weighted_recall: number;
  weighted_f1: number;
  roc_auc_ovr?: number | null;
  per_class: Record<string, { precision: number; recall: number; f1_score: number; support: number }>;
  confusion_matrix: ConfusionMatrixData;
  classification_report_text: string;
  training_duration_seconds?: number;
  inference_duration_seconds?: number;
  cv_weighted_f1_mean?: number | null;
  cv_weighted_f1_std?: number | null;
  total_test_samples: number;
}

export interface ModelDetail {
  model_id: string;
  metadata: {
    model_name: string;
    model_type: string;
    target_column: string;
    classes: string[];
    features: string[];
    numeric_features: string[];
    categorical_features: string[];
    train_samples_count: number;
    test_samples_count: number;
    random_state: number;
    test_size: number;
    saved_at?: string;
  };
  metrics: ModelMetricsDetail;
}

export interface PredictionItem {
  index: number;
  predicted_class: string;
  confidence?: number | null;
  class_probabilities?: Record<string, number>;
}

export interface PredictionResponse {
  model_id: string;
  model_name: string;
  total_records: number;
  predictions_summary: Record<string, number>;
  classes: string[];
  records: PredictionItem[];
  disclaimer: string;
}

export interface AnomalyResult {
  total_records: number;
  flagged_count: number;
  flagged_percentage: number;
  threshold: number;
  score_distribution: Array<{ bin_range: string; bin_min: number; bin_max: number; count: number }>;
  feature_comparisons: Array<{ feature: string; overall_mean: number; anomalous_mean: number; baseline_mean: number }>;
  flagged_records: Array<{ index: number; anomaly_score: number; is_anomaly: boolean; attributes: Record<string, any> }>;
  interpretation: string;
}

export interface GlobalExplanation {
  model_id: string;
  model_name: string;
  model_type: string;
  method: string;
  total_features: number;
  top_features: Array<{ feature: string; importance: number }>;
  limitations: string;
}

export interface LocalExplanation {
  model_id: string;
  model_name: string;
  predicted_class: string;
  explanation_method: string;
  top_drivers: Array<{ feature: string; contribution: number; impact: string; original_value: any }>;
  narrative_summary: string;
  limitations: string;
}

export interface CopilotFinding {
  category: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  supporting_features: string[];
}

export interface CopilotChatResponse {
  reply: string;
  summary: string;
  findings: CopilotFinding[];
  evidence_references: string[];
  uncertainty_notes: string;
  recommendations: string[];
  is_rule_based_fallback: boolean;
  provider: string;
}

export interface AgentStepStatus {
  agent_name: string;
  stage: string;
  status: "pending" | "running" | "completed" | "error";
  started_at?: string | null;
  completed_at?: string | null;
  output_summary?: string | null;
  evidence_collected_count: number;
}

export interface InvestigationDetail {
  investigation_id: string;
  title: string;
  status: "running" | "completed" | "canceled" | "failed";
  created_at: string;
  completed_at?: string | null;
  dataset_name: string;
  model_name?: string | null;
  steps: AgentStepStatus[];
  evidence_dossier: Record<string, any>;
  final_report_markdown?: string | null;
  final_report_json?: Record<string, any> | null;
}

export interface InvestigationSummary {
  investigation_id: string;
  title: string;
  status: string;
  created_at: string;
  completed_at?: string | null;
  dataset_name: string;
  anomalies_flagged: number;
  risk_level: string;
}

