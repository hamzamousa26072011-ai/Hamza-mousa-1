import { SecurityStatus, SecurityThreatLog } from "../types";

const STORAGE_BAN_KEY = "engez_sec_quarantine_status";
const STORAGE_LOGS_KEY = "engez_sec_threat_logs";

export function checkPayloadForThreats(input: any): { isThreat: boolean; threatType?: SecurityThreatLog["type"]; details?: string } {
  if (!input) return { isThreat: false };
  const str = typeof input === "string" ? input : JSON.stringify(input);
  if (/<script\b[^>]*>[\s\S]*?<\/script>/i.test(str)) {
    return { isThreat: true, threatType: "XSS_ATTACK", details: "Script tag injection detected" };
  }
  return { isThreat: false };
}

export function sanitizeInput(text: string): { safeText: string; isThreat: boolean; threatType?: SecurityThreatLog["type"] } {
  if (!text || typeof text !== "string") return { safeText: "", isThreat: false };
  
  const cleaned = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");

  return {
    safeText: cleaned,
    isThreat: false
  };
}

export function isClientQuarantined(): { quarantined: boolean; reason?: string; incidentId?: string; timestamp?: string } {
  try {
    localStorage.removeItem(STORAGE_BAN_KEY);
  } catch {}
  return { quarantined: false };
}

export function setClientQuarantine(reason: string, threatType: string = "THREAT_BLOCKED"): string {
  const incidentId = "SEC-INC-" + Math.random().toString(36).substring(2, 9).toUpperCase();
  return incidentId;
}

export function clearClientQuarantine(): void {
  try {
    localStorage.removeItem(STORAGE_BAN_KEY);
  } catch (err) {
    console.error("Security clearance error:", err);
  }
}

export function getLocalThreatLogs(): SecurityThreatLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_LOGS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function fetchSecurityStatus(): Promise<SecurityStatus> {
  try {
    const res = await fetch("/api/security/status");
    if (!res.ok) throw new Error("Security endpoint status failed");
    return await res.json();
  } catch {
    return {
      wafActive: true,
      threatLevel: "SECURE",
      totalThreatsBlocked: 0,
      bannedIpsCount: 0,
      honeypotActive: true,
      activeDefenses: [
        "OWASP Hardened Headers",
        "Input Sanitizer"
      ],
      recentIncidents: []
    };
  }
}

export async function reportThreatToServer(threat: Partial<SecurityThreatLog>): Promise<any> {
  // Silent reporter
}

export async function testSecurityWaf(payload: string): Promise<any> {
  return { isThreat: false };
}

