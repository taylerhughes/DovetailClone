import { AssemblyAI } from "assemblyai";

let client: AssemblyAI | null = null;

export function isTranscriptionEnabled(): boolean {
  return Boolean(process.env.ASSEMBLYAI_API_KEY);
}

export function getAssemblyAiClient(): AssemblyAI {
  if (!process.env.ASSEMBLYAI_API_KEY) {
    throw new Error("ASSEMBLYAI_API_KEY is not set; transcription is disabled.");
  }
  if (!client) {
    client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });
  }
  return client;
}
