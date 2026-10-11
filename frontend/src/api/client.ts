import {
  AnomalyResult,
  DatasetProfile,
  GlobalExplanation,
  LocalExplanation,
  ModelDetail,
  ModelSummary,
  PredictionResponse,
  RecordsPageData,
  SystemStatus,
  UserProfile,
  AuthResponse,
} from "../types";

const API_BASE = "/api/v1";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = typeof window !== "undefined" ? localStorage.getItem("netsage_token") : null;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(url, {
    ...options,
    headers: {
      "Accept": "application/json",
      ...authHeaders,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        errorMessage = typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail);
      } else if (errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // fallback to status text
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Authentication & User Session
  loginWithGoogle: (credential: string) => request<AuthResponse>("/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  }),
  registerWithEmail: (payload: { full_name: string; email: string; password: string }) => request<AuthResponse>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }),
  loginWithEmail: (payload: { email: string; password: string }) => request<AuthResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }),
  getMe: () => request<UserProfile>("/auth/me"),
  logout: () => request<{ status: string; message: string }>("/auth/logout", { method: "POST" }),
  forgotPassword: (email: string) => request<{ message: string; instructions: string }>("/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  }),

  getHealth: () => request<{ status: string; version: string; uptime_seconds: number }>("/health"),
  getStatus: () => request<SystemStatus>("/status"),
  
  // Datasets
  loadSampleDataset: () => request<DatasetProfile>("/datasets/sample", { method: "POST" }),
  uploadDataset: async (file: File): Promise<DatasetProfile> => {
    const formData = new FormData();
    formData.append("file", file);
    return request<DatasetProfile>("/datasets/upload", {
      method: "POST",
      body: formData,
    });
  },
  getDatasetProfile: () => request<DatasetProfile>("/datasets/profile"),
  getRecords: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    targetFilter?: string;
    protoFilter?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.pageSize) query.append("page_size", params.pageSize.toString());
    if (params.search) query.append("search", params.search);
    if (params.targetFilter) query.append("target_filter", params.targetFilter);
    if (params.protoFilter) query.append("proto_filter", params.protoFilter);
    if (params.sortBy) query.append("sort_by", params.sortBy);
    if (params.sortOrder) query.append("sort_order", params.sortOrder);
    return request<RecordsPageData>(`/datasets/records?${query.toString()}`);
  },
  getExportUrl: (targetFilter?: string) => {
    return `${API_BASE}/datasets/export${targetFilter ? `?target_filter=${encodeURIComponent(targetFilter)}` : ""}`;
  },

  // Models
  getModels: () => request<ModelSummary[]>("/models"),
  trainModel: (payload: {
    model_type: string;
    test_size?: number;
    random_state?: number;
    run_cv?: boolean;
  }) => request<{ model_id: string; model_name: string; metrics: any; metadata: any; message: string }>("/models/train", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }),
  getModelMetrics: (modelId: string) => request<ModelDetail>(`/models/${encodeURIComponent(modelId)}/metrics`),
  activateModel: (modelId: string) => request<{ active_model_id: string; message: string }>(`/models/${encodeURIComponent(modelId)}/activate`, {
    method: "POST",
  }),

  // Predictions
  predictSingle: (features: Record<string, any>, modelId?: string) => request<PredictionResponse>("/predictions/single", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ features, model_id: modelId }),
  }),
  predictBatch: async (file: File, modelId?: string): Promise<PredictionResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const query = modelId ? `?model_id=${encodeURIComponent(modelId)}` : "";
    return request<PredictionResponse>(`/predictions/batch${query}`, {
      method: "POST",
      body: formData,
    });
  },

  // Anomalies
  detectAnomalies: (contamination: number = 0.05, threshold?: number) => request<AnomalyResult>("/anomalies/detect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contamination, threshold }),
  }),

  // Explainability
  getGlobalExplanation: (modelId?: string, topN: number = 15) => {
    const query = new URLSearchParams();
    if (modelId) query.append("model_id", modelId);
    query.append("top_n", topN.toString());
    return request<GlobalExplanation>(`/explanations/global?${query.toString()}`);
  },
  getLocalExplanation: (payload: {
    record: Record<string, any>;
    predicted_class?: string;
    model_id?: string;
  }) => request<LocalExplanation>("/explanations/local", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }),

  // Reports
  getReportSummary: () => request<any>("/reports/summary?export_format=json"),
  getReportDownloadUrl: (format: "txt" | "json" = "txt") => `${API_BASE}/reports/summary?export_format=${format}`,

  // Copilot
  chatWithCopilot: (
    message: string,
    conversationId?: string,
    contextType: string = "general",
    selectedRecord?: Record<string, any>,
    contextData?: Record<string, any>
  ) =>
    request<import("../types").CopilotChatResponse>("/copilot/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        context_type: contextType,
        selected_record: selectedRecord,
        context_data: contextData,
      }),
    }),
  getConversations: () => request<import("../types").ConversationSummary[]>("/copilot/conversations"),
  createConversation: (title?: string) =>
    request<import("../types").ConversationSummary>(
      `/copilot/conversations${title ? `?title=${encodeURIComponent(title)}` : ""}`,
      { method: "POST" }
    ),
  getConversationHistory: (conversationId: string) =>
    request<{
      conversation_id: string;
      title: string;
      created_at: string;
      updated_at: string;
      messages: import("../types").ChatMessageItem[];
    }>(`/copilot/conversations/${encodeURIComponent(conversationId)}`),
  deleteConversation: (conversationId: string) =>
    request<{ conversation_id: string; status: string }>(`/copilot/conversations/${encodeURIComponent(conversationId)}`, {
      method: "DELETE",
    }),
  clearAllConversations: () =>
    request<{ status: string; message: string }>("/copilot/conversations", { method: "DELETE" }),


  // AI Agent Investigations
  startInvestigation: (payload: {
    title?: string;
    target_category?: string;
    anomaly_threshold?: number;
    max_records_to_investigate?: number;
  }) => request<import("../types").InvestigationDetail>("/investigations/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }),
  getInvestigations: () => request<import("../types").InvestigationSummary[]>("/investigations"),
  getInvestigationDetail: (id: string) =>
    request<import("../types").InvestigationDetail>(`/investigations/${encodeURIComponent(id)}`),
  cancelInvestigation: (id: string) =>
    request<{ investigation_id: string; status: string }>(`/investigations/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
    }),
  getInvestigationReportDownloadUrl: (reportId: string, format: "markdown" | "json" = "markdown") =>
    `${API_BASE}/reports/${encodeURIComponent(reportId)}?format=${format}`,
};

