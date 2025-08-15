import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { query } from "./database";
import type { ApiKey } from "./database";

export interface ApiKeyWithKey extends Omit<ApiKey, "key_hash"> {
  key: string;
}

// Helper function to safely parse permissions (handles both string and array)
function safeParsePermissions(permissions: unknown): string[] {
  if (!permissions) return ["send"];
  if (typeof permissions === "string") {
    try {
      return JSON.parse(permissions);
    } catch {
      return ["send"];
    }
  }
  if (Array.isArray(permissions)) {
    return permissions;
  }
  return ["send"];
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

  try {
    const result = await query(
      `INSERT INTO api_keys (user_id, domain_id, key_name, key_hash, key_prefix, permissions) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        userId,
        domainId,
        keyName,
        keyHash,
        `frs_${keyId}`,
        JSON.stringify(permissions),
      ]
    );

    if (result.rows.length === 0) {
      throw new Error("Failed to create API key");
    }

    const data = result.rows[0];
    return {
      ...data,
      permissions: safeParsePermissions(data.permissions),
      key: apiKey,
    };
  } catch (error: any) {
    throw new Error(`Failed to create API key: ${error.message}`);
  }
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

  try {
    const result = await query("SELECT * FROM api_keys WHERE key_prefix = $1", [
      prefix,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    // Verify the full key against each possible match
    for (const key of result.rows) {
      const isValid = await bcrypt.compare(apiKey, key.key_hash);
      if (isValid) {
        // Update last used timestamp
        await query("UPDATE api_keys SET last_used_at = NOW() WHERE id = $1", [
          key.id,
        ]);

        // Parse JSON fields
        return {
          ...key,
          permissions: safeParsePermissions(key.permissions),
        };
      }
    }

    return null;
  } catch (error) {
    console.error("API key verification error:", error);
    return null;
  }
}

export async function getUserApiKeys(userId: string): Promise<ApiKey[]> {
  try {
    const result = await query(
      `SELECT 
        ak.*,
        d.domain as domain_name
      FROM api_keys ak
      LEFT JOIN domains d ON ak.domain_id = d.id
      WHERE ak.user_id = $1
      ORDER BY ak.created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => ({
      ...row,
      permissions: safeParsePermissions(row.permissions),
      domains: row.domain_name ? { domain: row.domain_name } : null,
    }));
  } catch (error: any) {
    throw new Error(`Failed to fetch API keys: ${error.message}`);
  }
}

export async function getDomainApiKeys(domainId: string): Promise<ApiKey[]> {
  try {
    const result = await query(
      `SELECT * FROM api_keys 
       WHERE domain_id = $1 
       ORDER BY created_at DESC`,
      [domainId]
    );

    return result.rows.map((row) => ({
      ...row,
      permissions: safeParsePermissions(row.permissions),
    }));
  } catch (error: any) {
    throw new Error(`Failed to fetch domain API keys: ${error.message}`);
  }
}

export async function deleteApiKey(
  keyId: string,
  userId: string
): Promise<void> {
  try {
    const result = await query(
      "DELETE FROM api_keys WHERE id = $1 AND user_id = $2",
      [keyId, userId]
    );

    if (result.rowCount === 0) {
      throw new Error("API key not found or access denied");
    }
  } catch (error: any) {
    throw new Error(`Failed to delete API key: ${error.message}`);
  }
}

export async function updateApiKeyPermissions(
  keyId: string,
  userId: string,
  permissions: string[]
): Promise<void> {
  try {
    const result = await query(
      "UPDATE api_keys SET permissions = $1 WHERE id = $2 AND user_id = $3",
      [JSON.stringify(permissions), keyId, userId]
    );

    if (result.rowCount === 0) {
      throw new Error("API key not found or access denied");
    }
  } catch (error: any) {
    throw new Error(`Failed to update API key permissions: ${error.message}`);
  }
}

export function maskApiKey(apiKey: string): string {
  const parts = apiKey.split("_");
  if (parts.length !== 3) return apiKey;

  return `${parts[0]}_${parts[1]}_${"*".repeat(parts[2].length)}`;
}
