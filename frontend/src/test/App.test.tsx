import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "../App";

// Mock fetch globally
beforeEach(() => {
  vi.spyOn(global, "fetch").mockImplementation((url: any) => {
    const urlStr = String(url);
    if (urlStr.includes("/status")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          dataset_loaded: false,
          dataset_name: null,
          dataset_records_count: 0,
          dataset_features_count: 0,
          dataset_classes_count: 0,
          loaded_models_count: 0,
          active_model_name: null,
          anomaly_detector_ready: false,
          system_timestamp: "2026-10-11T20:00:00Z",
        }),
      } as Response);
    }
    if (urlStr.includes("/profile")) {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "No dataset loaded" }),
      } as Response);
    }
    if (urlStr.includes("/models")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);
  });
});

describe("NetSage Frontend Application", () => {
  it("renders the application brand and navigation shell", async () => {
    render(<App />);
    expect(screen.getAllByText("NetSage").length).toBeGreaterThan(0);
    expect(screen.getByText("IoT Flow Intelligence")).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Traffic Explorer")).toBeInTheDocument();
    expect(screen.getByText("Model Lab")).toBeInTheDocument();
  });

  it("displays onboarding state when no dataset is loaded", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Turn IoT Flow Telemetry Into Actionable Security Intelligence")).toBeInTheDocument();
      expect(screen.getByText("Load UCI RT-IoT2022 Fixture")).toBeInTheDocument();
    });
  });

  it("navigates across primary application views", async () => {
    render(<App />);
    
    // Click on Settings / About
    const settingsBtn = screen.getByText("Settings / About");
    fireEvent.click(settingsBtn);

    await waitFor(() => {
      expect(screen.getByText("UCI RT-IoT2022: Real-Time Internet of Things 2022 Dataset")).toBeInTheDocument();
      expect(screen.getByText("Defensive Principles & Privacy Architecture")).toBeInTheDocument();
    });

    // Click on Traffic Explorer
    const trafficBtn = screen.getByText("Traffic Explorer");
    fireEvent.click(trafficBtn);

    await waitFor(() => {
      expect(screen.getByText("No Telemetry Loaded")).toBeInTheDocument();
    });
  });
});
