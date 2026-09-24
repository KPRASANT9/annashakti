import { cookies } from "next/headers";
import { buildDemoBiomarkers } from "./demo";
import type {
  RuntimeBiomarkers,
  WhoopBodyMeasurement,
  WhoopCycle,
  WhoopPaginated,
  WhoopRecovery,
  WhoopSleep,
  WhoopUserProfile,
  WhoopWorkout,
} from "./types";

export const WHOOP_AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
export const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
export const WHOOP_API_BASE = "https://api.prod.whoop.com/developer";

export const WHOOP_SCOPES = [
  "offline",
  "read:recovery",
  "read:cycles",
  "read:sleep",
  "read:workout",
  "read:profile",
  "read:body_measurement",
].join(" ");

const TOKEN_COOKIE = "annashakti_whoop_token";
const REFRESH_COOKIE = "annashakti_whoop_refresh";

export function whoopConfigured(): boolean {
  return Boolean(
    process.env.WHOOP_CLIENT_ID && process.env.WHOOP_CLIENT_SECRET,
  );
}

export function whoopMode(): "demo" | "live" {
  // Explicit demo override for lab experiments.
  if (process.env.WHOOP_MODE === "demo") return "demo";
  if (process.env.WHOOP_ACCESS_TOKEN) return "live";
  if (whoopConfigured()) return "live";
  return "demo";
}

export function buildAuthorizeUrl(state: string): string {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const redirectUri =
    process.env.WHOOP_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/whoop/callback`;

  if (!clientId) {
    throw new Error("WHOOP_CLIENT_ID is not configured");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: WHOOP_SCOPES,
    state,
  });

  return `${WHOOP_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const clientId = process.env.WHOOP_CLIENT_ID!;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET!;
  const redirectUri =
    process.env.WHOOP_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/whoop/callback`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WHOOP token exchange failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope: string;
  }>;
}

export async function refreshAccessToken(refreshToken: string) {
  const clientId = process.env.WHOOP_CLIENT_ID!;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET!;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    scope: WHOOP_SCOPES,
  });

  const res = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WHOOP refresh failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }>;
}

export async function persistTokens(tokens: {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}) {
  const jar = await cookies();
  jar.set(TOKEN_COOKIE, tokens.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: tokens.expires_in,
  });
  if (tokens.refresh_token) {
    jar.set(REFRESH_COOKIE, tokens.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

export async function clearTokens() {
  const jar = await cookies();
  jar.delete(TOKEN_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

async function resolveAccessToken(): Promise<string | null> {
  if (process.env.WHOOP_ACCESS_TOKEN) return process.env.WHOOP_ACCESS_TOKEN;

  const jar = await cookies();
  const access = jar.get(TOKEN_COOKIE)?.value;
  if (access) return access;

  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (refresh && whoopConfigured()) {
    const tokens = await refreshAccessToken(refresh);
    await persistTokens(tokens);
    return tokens.access_token;
  }

  return null;
}

async function whoopGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${WHOOP_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WHOOP ${path} failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<T>;
}

async function fetchCollection<T>(
  path: string,
  token: string,
  limit = 10,
): Promise<T[]> {
  const data = await whoopGet<WhoopPaginated<T>>(
    `${path}?limit=${limit}`,
    token,
  );
  return data.records ?? [];
}

function milliToHours(ms: number | undefined | null): number | null {
  if (ms == null) return null;
  return ms / 3_600_000;
}

export function curateBiomarkers(input: {
  source: "whoop_live" | "whoop_demo";
  profile?: WhoopUserProfile;
  body?: WhoopBodyMeasurement;
  recoveries: WhoopRecovery[];
  cycles: WhoopCycle[];
  sleeps: WhoopSleep[];
  workouts: WhoopWorkout[];
}): RuntimeBiomarkers {
  const recovery = input.recoveries[0];
  const cycle = input.cycles[0];
  const sleep = input.sleeps.find((s) => !s.nap) ?? input.sleeps[0];
  const stages = sleep?.score?.stage_summary;

  return {
    capturedAt: new Date().toISOString(),
    source: input.source,
    profile: input.profile,
    body: input.body,
    recovery: {
      score: recovery?.score?.recovery_score ?? null,
      restingHeartRate: recovery?.score?.resting_heart_rate ?? null,
      hrvRmssdMilli: recovery?.score?.hrv_rmssd_milli ?? null,
      spo2Percent: recovery?.score?.spo2_percentage ?? null,
      skinTempCelsius: recovery?.score?.skin_temp_celsius ?? null,
      calibrating: recovery?.score?.user_calibrating ?? false,
    },
    cycle: {
      strain: cycle?.score?.strain ?? null,
      kilojoule: cycle?.score?.kilojoule ?? null,
      averageHeartRate: cycle?.score?.average_heart_rate ?? null,
      maxHeartRate: cycle?.score?.max_heart_rate ?? null,
      start: cycle?.start ?? null,
      end: cycle?.end ?? null,
    },
    sleep: {
      performancePercent: sleep?.score?.sleep_performance_percentage ?? null,
      consistencyPercent: sleep?.score?.sleep_consistency_percentage ?? null,
      efficiencyPercent: sleep?.score?.sleep_efficiency_percentage ?? null,
      respiratoryRate: sleep?.score?.respiratory_rate ?? null,
      totalSleepHours: stages
        ? milliToHours(
            stages.total_light_sleep_time_milli +
              stages.total_slow_wave_sleep_time_milli +
              stages.total_rem_sleep_time_milli,
          )
        : null,
      remHours: milliToHours(stages?.total_rem_sleep_time_milli),
      slowWaveHours: milliToHours(stages?.total_slow_wave_sleep_time_milli),
      lightHours: milliToHours(stages?.total_light_sleep_time_milli),
      disturbanceCount: stages?.disturbance_count ?? null,
      sleepDebtHours: milliToHours(
        sleep?.score?.sleep_needed.need_from_sleep_debt_milli,
      ),
    },
    workouts: input.workouts.map((w) => ({
      sportId: w.sport_id,
      strain: w.score?.strain ?? null,
      averageHeartRate: w.score?.average_heart_rate ?? null,
      maxHeartRate: w.score?.max_heart_rate ?? null,
      kilojoule: w.score?.kilojoule ?? null,
      start: w.start,
      end: w.end,
    })),
    history: {
      recoveries: input.recoveries,
      cycles: input.cycles,
      sleeps: input.sleeps,
      workouts: input.workouts,
    },
  };
}

/** Runtime biomarker ingestion — live WHOOP when authorized, else demo fixtures. */
export async function ingestRuntimeBiomarkers(): Promise<{
  biomarkers: RuntimeBiomarkers;
  connected: boolean;
  mode: "demo" | "live";
}> {
  const mode = whoopMode();
  const token = await resolveAccessToken();

  if (!token || mode === "demo") {
    return {
      biomarkers: buildDemoBiomarkers(),
      connected: false,
      mode: "demo",
    };
  }

  const [profile, body, recoveries, cycles, sleeps, workouts] =
    await Promise.all([
      whoopGet<WhoopUserProfile>("/v1/user/profile/basic", token).catch(
        () => undefined,
      ),
      whoopGet<WhoopBodyMeasurement>(
        "/v1/user/measurement/body",
        token,
      ).catch(() => undefined),
      fetchCollection<WhoopRecovery>("/v2/recovery", token, 14),
      fetchCollection<WhoopCycle>("/v2/cycle", token, 14),
      fetchCollection<WhoopSleep>("/v2/activity/sleep", token, 14),
      fetchCollection<WhoopWorkout>("/v2/activity/workout", token, 14),
    ]);

  return {
    biomarkers: curateBiomarkers({
      source: "whoop_live",
      profile,
      body,
      recoveries,
      cycles,
      sleeps,
      workouts,
    }),
    connected: true,
    mode: "live",
  };
}
