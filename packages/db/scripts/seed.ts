/**
 * Seed the linked Supabase project with demo data.
 *   pnpm --filter @dudu/db seed
 * Reads NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GATEWAY_DEVICE_SECRET_PEPPER from .env.local.
 * Optional: SEED_OWNER_EMAIL (your Google/magic-link email for the owner admin),
 *           SEED_TEST_PASSWORD (password for the synthetic @dudu.local accounts, used by dev login + Playwright).
 * Device secrets are regenerated on every run and written to packages/db/.seed-devices.local.json (gitignored).
 */
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createServiceClient, projectRefFromUrl } from "../src/index";
import { generateDeviceSecret, hashDeviceSecret } from "../src/device-secret";
import { DB_ROOT } from "../src/testing";
import { buildSeed } from "../seed/data";
import { applySeed } from "../seed/apply";
import { supabaseSink } from "../seed/supabase-sink";

const envFile = join(DB_ROOT, "..", "..", ".env.local");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const pepper = process.env.GATEWAY_DEVICE_SECRET_PEPPER ?? "";
const serials = ["DB01-2611-0001", "DB02-2611-0002", "DB03-2611-0003", "DB04-2611-0004"];
const secrets = Object.fromEntries(serials.map((s) => [s, generateDeviceSecret()]));
const hashes = Object.fromEntries(serials.map((s) => [s, hashDeviceSecret(secrets[s]!, pepper)]));

const data = buildSeed({
  ownerEmail: process.env.SEED_OWNER_EMAIL || undefined,
  deviceSecretHashes: hashes,
});
const sb = createServiceClient();

console.info(
  `Seeding Supabase project ${projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!)} …`,
);
await applySeed(
  data,
  supabaseSink(sb, {
    testPassword: process.env.SEED_TEST_PASSWORD || process.env.SEED_PARENT_PASSWORD,
  }),
  (m) => console.info("  " + m),
);

const out = join(DB_ROOT, ".seed-devices.local.json");
writeFileSync(
  out,
  JSON.stringify(
    {
      note: "Dev device credentials for apps/gateway/scripts/fake-device.ts. Regenerated on each seed. Do not commit.",
      pairing: data.pairing,
      devices: data.devices.map((d) => ({ ...d, secret: secrets[d.serial] })),
    },
    null,
    2,
  ),
);
console.info(`Done. Device credentials written to ${out}`);
