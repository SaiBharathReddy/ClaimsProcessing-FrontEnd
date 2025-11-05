import axios from "axios";
import type { ExtractedPayload, EvaluationResponse } from "./types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE, // e.g., http://localhost:8080/api
});

export async function extractDocs(formData: FormData): Promise<ExtractedPayload> {
  const { data } = await api.post<ExtractedPayload>("/claims/extract", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  console.log("Extracted document data:", data);
  return data;
}

export async function evaluateClaim(payload: ExtractedPayload): Promise<EvaluationResponse> {
    console.log("Evaluating claim with payload:", payload);
  const { data } = await api.post<EvaluationResponse>("/claims/evaluate", payload);
  return data;
}
