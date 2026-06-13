'use client';

// Thin wrappers over Supabase Auth's built-in TOTP MFA. No extra services,
// no cost — it's part of Supabase Auth.

import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type AnyClient = any;

export interface TotpFactor {
  id: string;
  status: 'verified' | 'unverified';
  friendlyName?: string;
}

export interface EnrollResult {
  factorId: string;
  qrSvg: string; // inline SVG QR code
  secret: string; // manual-entry secret
}

export async function listTotpFactors(): Promise<TotpFactor[]> {
  const supabase = getSupabaseBrowserClient() as AnyClient;
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return [];
  return (data?.totp ?? []) as TotpFactor[];
}

/** True when the account has at least one verified TOTP factor. */
export async function hasVerifiedTotp(): Promise<boolean> {
  const factors = await listTotpFactors();
  return factors.some((f) => f.status === 'verified');
}

export async function enrollTotp(): Promise<{ data: EnrollResult | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient() as AnyClient;

  // Clean up any dangling unverified factors first — they pile up if a previous
  // setup attempt was abandoned, and Supabase caps the number of factors.
  const existing = await listTotpFactors();
  await Promise.all(
    existing
      .filter((f) => f.status === 'unverified')
      .map((f) => supabase.auth.mfa.unenroll({ factorId: f.id })),
  );

  // Unique friendly name so a fast double-click (two in-flight enroll calls)
  // can never collide on the same name — that was the mfa_factor_name_conflict.
  const friendlyName = `Authenticator ${Date.now()}`;

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName,
  });
  if (error) return { data: null, error: error.message };

  return {
    data: {
      factorId: data.id,
      qrSvg: data.totp.qr_code,
      secret: data.totp.secret,
    },
    error: null,
  };
}

/** Verify the 6-digit code to activate an enrolled factor. */
export async function verifyTotpEnrollment(
  factorId: string,
  code: string,
): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient() as AnyClient;
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) return { error: challengeError.message };

  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });
  return { error: error ? error.message : null };
}

export async function unenrollTotp(factorId: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient() as AnyClient;
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  return { error: error ? error.message : null };
}

/**
 * Whether the current session must complete an MFA challenge to become fully
 * authenticated (i.e. user has 2FA and is still at aal1).
 */
export async function needsMfaChallenge(): Promise<boolean> {
  const supabase = getSupabaseBrowserClient() as AnyClient;
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return false;
  return data.nextLevel === 'aal2' && data.nextLevel !== data.currentLevel;
}

/** Complete the login-time MFA challenge with a TOTP code. */
export async function solveMfaChallenge(code: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient() as AnyClient;
  const factors = await listTotpFactors();
  const factor = factors.find((f) => f.status === 'verified');
  if (!factor) return { error: 'No authenticator is set up on this account.' };

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: factor.id,
  });
  if (challengeError) return { error: challengeError.message };

  const { error } = await supabase.auth.mfa.verify({
    factorId: factor.id,
    challengeId: challenge.id,
    code,
  });
  return { error: error ? error.message : null };
}
