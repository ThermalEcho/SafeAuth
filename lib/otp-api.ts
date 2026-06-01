import { getAuthBaseUrl, getAuthHeaders } from "@/lib/auth-client";

export interface OtpAccount {
  accountName: string;
  code: string;
  createdAt: string;
  digits: number;
  id: string;
  issuer: string;
  period: number;
  remainingSeconds: number;
}

export interface CreateOtpAccountInput {
  accountName?: string;
  issuer?: string;
  otpauthUrl?: string;
  secret?: string;
}

const OTP_ACCOUNTS_PATH = "/api/otp/accounts";

async function parseApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Request failed.");
  }

  return payload as T;
}

export async function listOtpAccounts(): Promise<OtpAccount[]> {
  const response = await fetch(`${getAuthBaseUrl()}${OTP_ACCOUNTS_PATH}`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });
  const payload = await parseApiResponse<{ accounts: OtpAccount[] }>(response);

  return payload.accounts;
}

export async function createOtpAccount(input: CreateOtpAccountInput): Promise<OtpAccount> {
  const response = await fetch(`${getAuthBaseUrl()}${OTP_ACCOUNTS_PATH}`, {
    body: JSON.stringify(input),
    credentials: "include",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = await parseApiResponse<{ account: OtpAccount }>(response);

  return payload.account;
}

export async function deleteOtpAccount(id: string): Promise<void> {
  const response = await fetch(`${getAuthBaseUrl()}${OTP_ACCOUNTS_PATH}/${id}`, {
    credentials: "include",
    headers: getAuthHeaders(),
    method: "DELETE",
  });

  if (!response.ok) {
    await parseApiResponse(response);
  }
}
