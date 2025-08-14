import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabase";
import type { ApiKey } from "./supabase";

export interface ApiKeyWithKey extends Omit<ApiKey, "key_hash"> {
  key: string;
}

export async function generateApiKey(
  userId: string,
  domainId: string,
  keyName: string,
  permissions: string[] = ["send"]
): Promise<ApiKeyWithKey> {
  // Generate a secure API key with prefix
  const keyId = nanoid(8);
  const keySecret = nanoid(32);
  const apiKey = `frs_${keyId}_${keySecret}`; // frs = FreeResend

  // Hash the key for storage
  const keyHash = await bcrypt.hash(apiKey, 10);

  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .insert({
      user_id: userId,
      domain_id: domainId,
      key_name: keyName,
      key_hash: keyHash,
      key_prefix: `frs_${keyId}`,
      permissions,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create API key: ${error.message}`);
  }

  return {
    ...data,
    key: apiKey,
  };
}

export async function verifyApiKey(apiKey: string): Promise<ApiKey | null> {
  // Extract prefix for efficient lookup
  // Split only on the first two underscores to handle underscores in the secret part
  const firstUnderscore = apiKey.indexOf("_");
  const secondUnderscore = apiKey.indexOf("_", firstUnderscore + 1);

  if (firstUnderscore === -1 || secondUnderscore === -1) {
    return null;
  }

  const prefix_part = apiKey.substring(0, firstUnderscore);
  const keyId_part = apiKey.substring(firstUnderscore + 1, secondUnderscore);
  const secret_part = apiKey.substring(secondUnderscore + 1);

  if (prefix_part !== "frs" || !keyId_part || !secret_part) {
    return null;
  }

  const prefix = `${prefix_part}_${keyId_part}`;

  const { data: keys, error } = await supabaseAdmin
    .from("api_keys")
    .select("*")
    .eq("key_prefix", prefix);

  if (error || !keys || keys.length === 0) {
    return null;
  }

  // Verify the full key against each possible match
  for (const key of keys) {
    const isValid = await bcrypt.compare(apiKey, key.key_hash);
    if (isValid) {
      // Update last used timestamp
      await supabaseAdmin
        .from("api_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", key.id);

      return key;
    }
  }

  return null;
}

export async function getUserApiKeys(userId: string): Promise<ApiKey[]> {
  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .select(
      `
      *,
      domains (
        domain
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch API keys: ${error.message}`);
  }

  return data || [];
}

export async function getDomainApiKeys(domainId: string): Promise<ApiKey[]> {
  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .select("*")
    .eq("domain_id", domainId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch domain API keys: ${error.message}`);
  }

  return data || [];
}

export async function deleteApiKey(
  keyId: string,
  userId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("api_keys")
    .delete()
    .eq("id", keyId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete API key: ${error.message}`);
  }
}

export async function updateApiKeyPermissions(
  keyId: string,
  userId: string,
  permissions: string[]
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("api_keys")
    .update({ permissions })
    .eq("id", keyId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to update API key permissions: ${error.message}`);
  }
}

export function maskApiKey(apiKey: string): string {
  const parts = apiKey.split("_");
  if (parts.length !== 3) return apiKey;

  return `${parts[0]}_${parts[1]}_${"*".repeat(parts[2].length)}`;
}
