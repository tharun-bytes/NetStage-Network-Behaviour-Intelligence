import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { DatasetProfile, ModelDetail, ModelSummary, SystemStatus } from "../types";

interface NotificationToast {
  type: "success" | "error" | "info";
  message: string;
}

export interface CopilotContextPayload {
  prompt: string;
  record?: Record<string, any>;
  type?: string;
}

interface AppContextType {
  status: SystemStatus | null;
  profile: DatasetProfile | null;
  models: ModelSummary[];
  activeModelId: string | null;
  activeModelDetail: ModelDetail | null;
  loading: boolean;
  error: string | null;
  notification: NotificationToast | null;
  copilotPayload: CopilotContextPayload | null;
  askCopilot: (prompt: string, record?: Record<string, any>, type?: string) => void;
  clearCopilotPayload: () => void;
  refreshStatus: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshModels: () => Promise<void>;
  loadSampleDataset: () => Promise<void>;
  uploadDataset: (file: File) => Promise<void>;
  selectActiveModel: (modelId: string) => Promise<void>;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  notify: (message: string, type?: "success" | "error" | "info") => void;
  clearNotification: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [activeModelDetail, setActiveModelDetail] = useState<ModelDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationToast | null>(null);
  const [copilotPayload, setCopilotPayload] = useState<CopilotContextPayload | null>(null);

  const askCopilot = (prompt: string, record?: Record<string, any>, type?: string) => {
    setCopilotPayload({ prompt, record, type });
  };

  const clearCopilotPayload = () => setCopilotPayload(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  const clearNotification = () => setNotification(null);

  const refreshStatus = async () => {
    try {
      const data = await api.getStatus();
      setStatus(data);
    } catch (err: any) {
      console.error("Failed to fetch system status:", err);
    }
  };

  const refreshProfile = async () => {
    try {
      const data = await api.getDatasetProfile();
      setProfile(data);
    } catch {
      setProfile(null);
    }
  };

  const refreshModels = async () => {
    try {
      const list = await api.getModels();
      setModels(list);
      const active = list.find((m) => m.is_active);
      if (active) {
        setActiveModelId(active.model_id);
        const detail = await api.getModelMetrics(active.model_id);
        setActiveModelDetail(detail);
      }
    } catch (err: any) {
      console.error("Failed to load models list:", err);
    }
  };

  const selectActiveModel = async (modelId: string) => {
    setLoading(true);
    try {
      await api.activateModel(modelId);
      setActiveModelId(modelId);
      const detail = await api.getModelMetrics(modelId);
      setActiveModelDetail(detail);
      await refreshModels();
      await refreshStatus();
      showToast(`Model ${detail.metadata.model_name} activated for inference`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to activate model", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadSampleDataset = async () => {
    setLoading(true);
    setError(null);
    try {
      const prof = await api.loadSampleDataset();
      setProfile(prof);
      await refreshStatus();
      showToast("UCI RT-IoT2022 sample dataset loaded successfully", "success");
    } catch (err: any) {
      setError(err.message);
      showToast(err.message || "Failed to load sample dataset", "error");
    } finally {
      setLoading(false);
    }
  };

  const uploadDataset = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const prof = await api.uploadDataset(file);
      setProfile(prof);
      await refreshStatus();
      showToast(`Uploaded ${file.name} (${prof.rows_count} records)`, "success");
    } catch (err: any) {
      setError(err.message);
      showToast(err.message || "Upload failed", "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial bootstrap
    const init = async () => {
      await refreshStatus();
      await refreshProfile();
      await refreshModels();
    };
    init();
  }, []);

  return (
    <AppContext.Provider
      value={{
        status,
        profile,
        models,
        activeModelId,
        activeModelDetail,
        loading,
        error,
        notification,
        copilotPayload,
        askCopilot,
        clearCopilotPayload,
        refreshStatus,
        refreshProfile,
        refreshModels,
        loadSampleDataset,
        uploadDataset,
        selectActiveModel,
        showToast,
        notify: showToast,
        clearNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
