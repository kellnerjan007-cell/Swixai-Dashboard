export const COIN_COSTS = {
  NORMAL_MATCH: 10,
  TOP_MATCH: 25,
  COMBO: 30,
  STATS_VIEW: 15,
  DAILY_STATS_PASS: 40,
} as const;

export const COIN_REWARDS = {
  AD_WATCH: 10,
  CORRECT_PREDICTION: 15,
  DAILY_LOGIN_DAY1: 5,
  DAILY_LOGIN_DAY3: 10,
  DAILY_LOGIN_DAY7: 25,
  SIGNUP_BONUS: 50,
} as const;

export const AD_LIMIT_PER_DAY = 5;

export const COIN_PACKAGES = [
  {
    id: "small",
    name: "Starter Pack",
    coins: 100,
    priceChf: 1.9,
    priceId: process.env.STRIPE_PRICE_SMALL ?? "",
  },
  {
    id: "medium",
    name: "Pro Pack",
    coins: 300,
    priceChf: 4.9,
    priceId: process.env.STRIPE_PRICE_MEDIUM ?? "",
    popular: true,
  },
  {
    id: "large",
    name: "Champion Pack",
    coins: 800,
    priceChf: 9.9,
    priceId: process.env.STRIPE_PRICE_LARGE ?? "",
  },
  {
    id: "vip",
    name: "VIP Monatsabo",
    coins: 0,
    dailyCoins: 30,
    priceChf: 7.9,
    priceId: process.env.STRIPE_PRICE_VIP ?? "",
    isSubscription: true,
    description: "30 Coins täglich + Alle Statistiken",
  },
] as const;

export function getDailyLoginReward(streak: number): number {
  if (streak >= 7) return COIN_REWARDS.DAILY_LOGIN_DAY7;
  if (streak >= 3) return COIN_REWARDS.DAILY_LOGIN_DAY3;
  return COIN_REWARDS.DAILY_LOGIN_DAY1;
}

export function isNewDay(lastDate: Date | null): boolean {
  if (!lastDate) return true;
  const today = new Date();
  return (
    today.getFullYear() !== lastDate.getFullYear() ||
    today.getMonth() !== lastDate.getMonth() ||
    today.getDate() !== lastDate.getDate()
  );
}
