import type {
  RuntimeBiomarkers,
  WhoopBodyMeasurement,
  WhoopCycle,
  WhoopRecovery,
  WhoopSleep,
  WhoopUserProfile,
  WhoopWorkout,
} from "./types";

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

function iso(offsetMs: number) {
  return new Date(now + offsetMs).toISOString();
}

/** Demo fixtures shaped like a mid-load training week for synthesis experiments. */
export const DEMO_PROFILE: WhoopUserProfile = {
  user_id: 10001,
  email: "practitioner@annashakti.local",
  first_name: "Prasanth",
  last_name: "Demo",
};

export const DEMO_BODY: WhoopBodyMeasurement = {
  height_meter: 1.75,
  weight_kilogram: 74.2,
  max_heart_rate: 188,
};

export const DEMO_RECOVERIES: WhoopRecovery[] = [
  {
    cycle_id: 9001,
    sleep_id: 8001,
    user_id: 10001,
    created_at: iso(-2 * 60 * 60 * 1000),
    updated_at: iso(-2 * 60 * 60 * 1000),
    score_state: "SCORED",
    score: {
      user_calibrating: false,
      recovery_score: 58,
      resting_heart_rate: 58,
      hrv_rmssd_milli: 42,
      spo2_percentage: 96.8,
      skin_temp_celsius: 33.4,
    },
  },
  {
    cycle_id: 9000,
    sleep_id: 8000,
    user_id: 10001,
    created_at: iso(-day),
    updated_at: iso(-day),
    score_state: "SCORED",
    score: {
      user_calibrating: false,
      recovery_score: 71,
      resting_heart_rate: 54,
      hrv_rmssd_milli: 58,
      spo2_percentage: 97.2,
      skin_temp_celsius: 33.1,
    },
  },
  {
    cycle_id: 8999,
    sleep_id: 7999,
    user_id: 10001,
    created_at: iso(-2 * day),
    updated_at: iso(-2 * day),
    score_state: "SCORED",
    score: {
      user_calibrating: false,
      recovery_score: 44,
      resting_heart_rate: 62,
      hrv_rmssd_milli: 34,
      spo2_percentage: 96.1,
      skin_temp_celsius: 33.8,
    },
  },
];

export const DEMO_CYCLES: WhoopCycle[] = [
  {
    id: 9001,
    user_id: 10001,
    created_at: iso(-14 * 60 * 60 * 1000),
    updated_at: iso(-1 * 60 * 60 * 1000),
    start: iso(-14 * 60 * 60 * 1000),
    end: null,
    timezone_offset: "+05:30",
    score_state: "SCORED",
    score: {
      strain: 14.2,
      kilojoule: 11800,
      average_heart_rate: 78,
      max_heart_rate: 168,
    },
  },
  {
    id: 9000,
    user_id: 10001,
    created_at: iso(-day - 14 * 60 * 60 * 1000),
    updated_at: iso(-day),
    start: iso(-day - 14 * 60 * 60 * 1000),
    end: iso(-14 * 60 * 60 * 1000),
    timezone_offset: "+05:30",
    score_state: "SCORED",
    score: {
      strain: 11.6,
      kilojoule: 9800,
      average_heart_rate: 74,
      max_heart_rate: 155,
    },
  },
];

export const DEMO_SLEEPS: WhoopSleep[] = [
  {
    id: 8001,
    user_id: 10001,
    created_at: iso(-10 * 60 * 60 * 1000),
    updated_at: iso(-2 * 60 * 60 * 1000),
    start: iso(-10 * 60 * 60 * 1000),
    end: iso(-2.5 * 60 * 60 * 1000),
    timezone_offset: "+05:30",
    nap: false,
    score_state: "SCORED",
    score: {
      stage_summary: {
        total_in_bed_time_milli: 7.5 * 3600 * 1000,
        total_awake_time_milli: 0.6 * 3600 * 1000,
        total_no_data_time_milli: 0,
        total_light_sleep_time_milli: 3.4 * 3600 * 1000,
        total_slow_wave_sleep_time_milli: 1.3 * 3600 * 1000,
        total_rem_sleep_time_milli: 1.4 * 3600 * 1000,
        sleep_cycle_count: 4,
        disturbance_count: 7,
      },
      sleep_needed: {
        baseline_milli: 7.5 * 3600 * 1000,
        need_from_sleep_debt_milli: 0.8 * 3600 * 1000,
        need_from_recent_strain_milli: 0.4 * 3600 * 1000,
        need_from_recent_nap_milli: 0,
      },
      respiratory_rate: 14.8,
      sleep_performance_percentage: 78,
      sleep_consistency_percentage: 64,
      sleep_efficiency_percentage: 88,
    },
  },
];

export const DEMO_WORKOUTS: WhoopWorkout[] = [
  {
    id: 7001,
    user_id: 10001,
    created_at: iso(-6 * 60 * 60 * 1000),
    updated_at: iso(-5 * 60 * 60 * 1000),
    start: iso(-6 * 60 * 60 * 1000),
    end: iso(-5 * 60 * 60 * 1000),
    timezone_offset: "+05:30",
    sport_id: 1,
    score_state: "SCORED",
    score: {
      strain: 10.4,
      average_heart_rate: 142,
      max_heart_rate: 168,
      kilojoule: 2100,
      percent_recorded: 98,
      zone_duration: {
        zone_zero_milli: 120000,
        zone_one_milli: 480000,
        zone_two_milli: 900000,
        zone_three_milli: 1200000,
        zone_four_milli: 600000,
        zone_five_milli: 180000,
      },
    },
  },
];

export function buildDemoBiomarkers(): RuntimeBiomarkers {
  const recovery = DEMO_RECOVERIES[0];
  const cycle = DEMO_CYCLES[0];
  const sleep = DEMO_SLEEPS[0];
  const stages = sleep.score?.stage_summary;

  return {
    capturedAt: new Date().toISOString(),
    source: "whoop_demo",
    profile: DEMO_PROFILE,
    body: DEMO_BODY,
    recovery: {
      score: recovery.score?.recovery_score ?? null,
      restingHeartRate: recovery.score?.resting_heart_rate ?? null,
      hrvRmssdMilli: recovery.score?.hrv_rmssd_milli ?? null,
      spo2Percent: recovery.score?.spo2_percentage ?? null,
      skinTempCelsius: recovery.score?.skin_temp_celsius ?? null,
      calibrating: recovery.score?.user_calibrating ?? false,
    },
    cycle: {
      strain: cycle.score?.strain ?? null,
      kilojoule: cycle.score?.kilojoule ?? null,
      averageHeartRate: cycle.score?.average_heart_rate ?? null,
      maxHeartRate: cycle.score?.max_heart_rate ?? null,
      start: cycle.start,
      end: cycle.end,
    },
    sleep: {
      performancePercent: sleep.score?.sleep_performance_percentage ?? null,
      consistencyPercent: sleep.score?.sleep_consistency_percentage ?? null,
      efficiencyPercent: sleep.score?.sleep_efficiency_percentage ?? null,
      respiratoryRate: sleep.score?.respiratory_rate ?? null,
      totalSleepHours: stages
        ? (stages.total_light_sleep_time_milli +
            stages.total_slow_wave_sleep_time_milli +
            stages.total_rem_sleep_time_milli) /
          3_600_000
        : null,
      remHours: stages ? stages.total_rem_sleep_time_milli / 3_600_000 : null,
      slowWaveHours: stages
        ? stages.total_slow_wave_sleep_time_milli / 3_600_000
        : null,
      lightHours: stages
        ? stages.total_light_sleep_time_milli / 3_600_000
        : null,
      disturbanceCount: stages?.disturbance_count ?? null,
      sleepDebtHours: sleep.score
        ? sleep.score.sleep_needed.need_from_sleep_debt_milli / 3_600_000
        : null,
    },
    workouts: DEMO_WORKOUTS.map((w) => ({
      sportId: w.sport_id,
      strain: w.score?.strain ?? null,
      averageHeartRate: w.score?.average_heart_rate ?? null,
      maxHeartRate: w.score?.max_heart_rate ?? null,
      kilojoule: w.score?.kilojoule ?? null,
      start: w.start,
      end: w.end,
    })),
    history: {
      recoveries: DEMO_RECOVERIES,
      cycles: DEMO_CYCLES,
      sleeps: DEMO_SLEEPS,
      workouts: DEMO_WORKOUTS,
    },
  };
}
