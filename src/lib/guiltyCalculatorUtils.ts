export type GuiltyCategoryType = "money" | "time" | "hybrid";

export interface GuiltyCategoryOption {
  value: string;
  label: string;
  type: GuiltyCategoryType;
}

export const guiltyCategories = [
  { value: "rauchen", label: "Rauchen", type: "money" },
  { value: "alkohol", label: "Alkohol / Trinken", type: "money" },
  { value: "fast-food", label: "Fast Food", type: "money" },
  { value: "kaffee-to-go", label: "Kaffee to go", type: "money" },
  { value: "energy-drinks", label: "Energy Drinks", type: "money" },
  { value: "feiern", label: "Feiern gehen", type: "money" },
  { value: "social-media", label: "Social Media", type: "time" },
  { value: "tiktok", label: "TikTok", type: "time" },
  { value: "instagram", label: "Instagram", type: "time" },
  { value: "youtube", label: "YouTube", type: "time" },
  { value: "gaming", label: "Gaming", type: "time" },
  { value: "streaming", label: "Streaming", type: "hybrid" },
  { value: "netflix", label: "Netflix", type: "hybrid" },
  { value: "disney-plus", label: "Disney+", type: "hybrid" },
  { value: "spotify", label: "Spotify", type: "hybrid" },
  { value: "twitch", label: "Twitch", type: "hybrid" },
  { value: "abos", label: "Subscriptions / Abos", type: "hybrid" },
] as const satisfies readonly GuiltyCategoryOption[];

export const guiltyFrequencies = [
  { value: "day", label: "pro Tag" },
  { value: "week", label: "pro Woche" },
  { value: "month", label: "pro Monat" },
  { value: "year", label: "pro Jahr" },
] as const;

export type GuiltyCategory = (typeof guiltyCategories)[number]["value"];
export type GuiltyFrequency = (typeof guiltyFrequencies)[number]["value"];

interface BaseInput {
  category: GuiltyCategory;
  years: number;
  months: number;
}

export interface GuiltyMoneyInput extends BaseInput {
  categoryType: "money";
  amount: number;
  frequency: GuiltyFrequency;
}

export interface GuiltyTimeInput extends BaseInput {
  categoryType: "time";
  hoursPerDay: number;
}

export interface GuiltyHybridInput extends BaseInput {
  categoryType: "hybrid";
  monthlyCost: number;
  hoursPerDay: number;
}

export type GuiltyCalculatorInput =
  | GuiltyMoneyInput
  | GuiltyTimeInput
  | GuiltyHybridInput;

export interface GuiltyChartPeriod {
  key: string;
  label: string;
  days: number;
  months: number;
  value: number;
}

interface BaseCalculationResult {
  category: GuiltyCategory;
  categoryType: GuiltyCategoryType;
  durationMonths: number;
  durationDays: number;
  periods: GuiltyChartPeriod[];
}

export interface GuiltyMoneyResult extends BaseCalculationResult {
  categoryType: "money";
  monthlyCost: number;
  yearlyCost: number;
  totalCost: number;
}

export interface GuiltyTimeResult extends BaseCalculationResult {
  categoryType: "time";
  hoursPerDay: number;
  totalHours: number;
  totalDays: number;
  totalWeeks: number;
}

export interface GuiltyHybridResult extends BaseCalculationResult {
  categoryType: "hybrid";
  monthlyCost: number;
  yearlyCost: number;
  totalCost: number;
  hoursPerDay: number;
  totalHours: number;
  totalDays: number;
  totalWeeks: number;
}

export type GuiltyCalculationResult =
  | GuiltyMoneyResult
  | GuiltyTimeResult
  | GuiltyHybridResult;

const DAYS_PER_MONTH = 365 / 12;
const WEEKS_PER_MONTH = 52 / 12;

const periodDefinitions = [
  { key: "week-1", label: "1 Woche", days: 7, months: 7 / DAYS_PER_MONTH },
  { key: "month-1", label: "1 Monat", days: DAYS_PER_MONTH, months: 1 },
  { key: "month-3", label: "3 Monate", days: DAYS_PER_MONTH * 3, months: 3 },
  { key: "month-6", label: "6 Monate", days: DAYS_PER_MONTH * 6, months: 6 },
  { key: "year-1", label: "1 Jahr", days: 365, months: 12 },
  { key: "year-3", label: "3 Jahre", days: 365 * 3, months: 36 },
  { key: "year-5", label: "5 Jahre", days: 365 * 5, months: 60 },
] as const;

export const getGuiltyCategoryByValue = (value: string) =>
  guiltyCategories.find((category) => category.value === value);

export const getDurationMonths = (years: number, months: number) =>
  Math.max(0, Math.floor(years) * 12 + Math.floor(months));

export const normalizeToMonthlyCost = (
  amount: number,
  frequency: GuiltyFrequency,
) => {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  switch (frequency) {
    case "day":
      return amount * DAYS_PER_MONTH;
    case "week":
      return amount * WEEKS_PER_MONTH;
    case "month":
      return amount;
    case "year":
      return amount / 12;
  }
};

const createPeriods = (
  durationMonths: number,
  getValue: (period: { days: number; months: number }) => number,
) => {
  const durationDays = durationMonths * DAYS_PER_MONTH;
  const periods = periodDefinitions
    .filter((period) => period.days <= durationDays)
    .map((period) => ({
      ...period,
      value: getValue(period),
    }));

  return [
    ...periods,
    {
      key: "total",
      label: "Gesamt",
      days: durationDays,
      months: durationMonths,
      value: getValue({ days: durationDays, months: durationMonths }),
    },
  ];
};

export const calculateGuiltyResult = (
  input: GuiltyCalculatorInput,
): GuiltyCalculationResult | null => {
  const durationMonths = getDurationMonths(input.years, input.months);
  const durationDays = durationMonths * DAYS_PER_MONTH;

  if (durationMonths <= 0) {
    return null;
  }

  if (input.categoryType === "money") {
    const monthlyCost = normalizeToMonthlyCost(input.amount, input.frequency);

    if (monthlyCost <= 0) {
      return null;
    }

    return {
      category: input.category,
      categoryType: input.categoryType,
      durationMonths,
      durationDays,
      monthlyCost,
      yearlyCost: monthlyCost * 12,
      totalCost: monthlyCost * durationMonths,
      periods: createPeriods(
        durationMonths,
        (period) => monthlyCost * period.months,
      ),
    };
  }

  if (input.categoryType === "time") {
    if (!Number.isFinite(input.hoursPerDay) || input.hoursPerDay <= 0) {
      return null;
    }

    const totalHours = input.hoursPerDay * durationDays;

    return {
      category: input.category,
      categoryType: input.categoryType,
      durationMonths,
      durationDays,
      hoursPerDay: input.hoursPerDay,
      totalHours,
      totalDays: totalHours / 24,
      totalWeeks: totalHours / 24 / 7,
      periods: createPeriods(
        durationMonths,
        (period) => input.hoursPerDay * period.days,
      ),
    };
  }

  if (
    !Number.isFinite(input.monthlyCost) ||
    input.monthlyCost <= 0 ||
    !Number.isFinite(input.hoursPerDay) ||
    input.hoursPerDay <= 0
  ) {
    return null;
  }

  const totalHours = input.hoursPerDay * durationDays;

  return {
    category: input.category,
    categoryType: input.categoryType,
    durationMonths,
    durationDays,
    monthlyCost: input.monthlyCost,
    yearlyCost: input.monthlyCost * 12,
    totalCost: input.monthlyCost * durationMonths,
    hoursPerDay: input.hoursPerDay,
    totalHours,
    totalDays: totalHours / 24,
    totalWeeks: totalHours / 24 / 7,
    periods: createPeriods(
      durationMonths,
      (period) => input.monthlyCost * period.months,
    ),
  };
};
