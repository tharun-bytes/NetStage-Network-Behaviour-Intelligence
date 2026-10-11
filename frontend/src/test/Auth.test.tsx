import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { LoginPage } from "../pages/LoginPage";
import { SignupPage } from "../pages/SignupPage";

// Mock fetch for auth tests
beforeEach(() => {
  localStorage.clear();
  vi.spyOn(global, "fetch").mockImplementation((url: any, options: any) => {
    const urlStr = String(url);
    if (urlStr.includes("/auth/login")) {
      const body = JSON.parse(options?.body || "{}");
      if (body.password === "WrongPassword") {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ detail: "Invalid email or password." }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          access_token: "mock_jwt_token_12345",
          token_type: "bearer",
          user: {
            user_id: "usr_test_1",
            email: body.email,
            full_name: "Test Analyst",
            auth_provider: "password",
          },
          message: "Authentication successful",
        }),
      } as Response);
    }
    if (urlStr.includes("/auth/register")) {
      const body = JSON.parse(options?.body || "{}");
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          access_token: "mock_jwt_reg_token",
          token_type: "bearer",
          user: {
            user_id: "usr_test_new",
            email: body.email,
            full_name: body.full_name,
            auth_provider: "password",
          },
          message: "Account registered successfully",
        }),
      } as Response);
    }
    if (urlStr.includes("/auth/me")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          user_id: "usr_test_1",
          email: "analyst@netsage.ai",
          full_name: "Lead Security Analyst",
          auth_provider: "password",
        }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);
  });
});

describe("NetSage Authentication Suite", () => {
  it("renders LoginPage with email/password and demo login options", () => {
    const onNavigate = vi.fn();
    render(
      <AuthProvider>
        <LoginPage onNavigate={onNavigate} />
      </AuthProvider>
    );

    expect(screen.getByText("Security Analyst Sign In")).toBeDefined();
    expect(screen.getByText("Continue with Google")).toBeDefined();
    expect(screen.getByPlaceholderText("analyst@domain.com")).toBeDefined();
    expect(screen.getByText("One-Click Demo Analyst Access")).toBeDefined();
  });

  it("handles demo analyst one-click login", async () => {
    const onNavigate = vi.fn();
    render(
      <AuthProvider>
        <LoginPage onNavigate={onNavigate} />
      </AuthProvider>
    );

    const demoBtn = screen.getByText("One-Click Demo Analyst Access");
    fireEvent.click(demoBtn);

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith("overview");
      expect(localStorage.getItem("netsage_token")).toBeDefined();
    });
  });

  it("renders SignupPage and displays password strength calculator", async () => {
    const onNavigate = vi.fn();
    render(
      <AuthProvider>
        <SignupPage onNavigate={onNavigate} />
      </AuthProvider>
    );

    expect(screen.getByText("Create Security Analyst Account")).toBeDefined();
    const passInput = screen.getByPlaceholderText("Minimum 6 characters");
    fireEvent.change(passInput, { target: { value: "Simple123!Safe" } });

    await waitFor(() => {
      expect(screen.getByText(/Strength:/i)).toBeDefined();
    });
  });
});
