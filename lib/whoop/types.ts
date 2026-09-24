/** WHOOP Developer API v2 types — curated for Annashakti runtime. */

export type WhoopScoreState = "SCORED" | "PENDING_SCORE" | "UNSCORABLE";

export interface WhoopUserProfile {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface WhoopBodyMeasurement {
  height_meter: number;
  weight_kilogram: number;
  max_heart_rate: number;
}

export interface WhoopRecoveryScore {
  user_calibrating: boolean;
  recovery_score: number;
  resting_heart_rate: number;
  hrv_rmssd_milli: number;
  spo2_percentage?: number;
  skin_temp_celsius?: number;
}

export interface WhoopRecovery {
  cycle_id: number;
  sleep_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: WhoopScoreState;
  score?: WhoopRecoveryScore;
}

export interface WhoopCycleScore {
  strain: number;
  kilojoule: number;
  average_heart_rate: number;
  max_heart_rate: number;
}

export interface WhoopCycle {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string | null;
  timezone_offset: string;
  score_state: WhoopScoreState;
  score?: WhoopCycleScore;
}

export interface WhoopSleepStageSummary {
  total_in_bed_time_milli: number;
  total_awake_time_milli: number;
  total_no_data_time_milli: number;
  total_light_sleep_time_milli: number;
  total_slow_wave_sleep_time_milli: number;
  total_rem_sleep_time_milli: number;
  sleep_cycle_count: number;
  disturbance_count: number;
}

export interface WhoopSleepNeeded {
  baseline_milli: number;
  need_from_sleep_debt_milli: number;
  need_from_recent_strain_milli: number;
  need_from_recent_nap_milli: number;
}

export interface WhoopSleepScore {
  stage_summary: WhoopSleepStageSummary;
  sleep_needed: WhoopSleepNeeded;
  respiratory_rate: number;
  sleep_performance_percentage: number;
  sleep_consistency_percentage: number;
  sleep_efficiency_percentage: number;
}

export interface WhoopSleep {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: WhoopScoreState;
  score?: WhoopSleepScore;
}

export interface WhoopWorkoutScore {
  strain: number;
  average_heart_rate: number;
  max_heart_rate: number;
  kilojoule: number;
  percent_recorded: number;
  distance_meter?: number;
  altitude_gain_meter?: number;
  altitude_change_meter?: number;
  zone_duration?: {
    zone_zero_milli: number;
    zone_one_milli: number;
    zone_two_milli: number;
    zone_three_milli: number;
    zone_four_milli: number;
    zone_five_milli: number;
  };
}

export interface WhoopWorkout {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  sport_id: number;
  score_state: WhoopScoreState;
  score?: WhoopWorkoutScore;
}

export interface WhoopPaginated<T> {
  records: T[];
  next_token: string | null;
}

/** Flattened runtime biomarker bundle used by the synthesis engine. */
export interface RuntimeBiomarkers {
  capturedAt: string;
  source: "whoop_live" | "whoop_demo";
  profile?: WhoopUserProfile;
  body?: WhoopBodyMeasurement;
  recovery: {
    score: number | null;
    restingHeartRate: number | null;
    hrvRmssdMilli: number | null;
    spo2Percent: number | null;
    skinTempCelsius: number | null;
    calibrating: boolean;
  };
  cycle: {
    strain: number | null;
    kilojoule: number | null;
    averageHeartRate: number | null;
    maxHeartRate: number | null;
    start: string | null;
    end: string | null;
  };
  sleep: {
    performancePercent: number | null;
    consistencyPercent: number | null;
    efficiencyPercent: number | null;
    respiratoryRate: number | null;
    totalSleepHours: number | null;
    remHours: number | null;
    slowWaveHours: number | null;
    lightHours: number | null;
    disturbanceCount: number | null;
    sleepDebtHours: number | null;
  };
  workouts: Array<{
    sportId: number;
    strain: number | null;
    averageHeartRate: number | null;
    maxHeartRate: number | null;
    kilojoule: number | null;
    start: string;
    end: string;
  }>;
  history: {
    recoveries: WhoopRecovery[];
    cycles: WhoopCycle[];
    sleeps: WhoopSleep[];
    workouts: WhoopWorkout[];
  };
}
