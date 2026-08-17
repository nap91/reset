import { Platform } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { ensureAnonymousSession, supabase } from '@/lib/supabase';
import { reportError, trackEvent } from '@/lib/analytics';

export const PRO_ENTITLEMENT = 'reset_pro';
export const FREE_PLAN_LIMIT = 3;
let configured = false;

export async function configurePurchases(userId: string) {
  if (configured || Platform.OS !== 'ios') return Boolean(configured);
  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
  if (!apiKey) return false;
  Purchases.configure({ apiKey, appUserID: userId });
  configured = true;
  return true;
}

export async function hasProAccess() {
  if (!configured) return false;
  try { return Boolean((await Purchases.getCustomerInfo()).entitlements.active[PRO_ENTITLEMENT]); }
  catch (cause) { reportError('subscription_status', cause); return false; }
}

export async function getPlanAccess() {
  await ensureAnonymousSession();
  const [pro, result] = await Promise.all([
    hasProAccess(),
    supabase.from('reset_sessions').select('id', { count: 'exact', head: true }).in('status', ['ready', 'active', 'completed']),
  ]);
  if (result.error) throw new Error(result.error.message);
  const used = result.count ?? 0;
  return { pro, used, remaining: pro ? null : Math.max(0, FREE_PLAN_LIMIT - used), canCreate: pro || used < FREE_PLAN_LIMIT };
}

export async function getSubscriptionPackages(): Promise<PurchasesPackage[]> {
  if (!configured) return [];
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export async function purchasePro(aPackage: PurchasesPackage) {
  const result = await Purchases.purchasePackage(aPackage);
  const active = Boolean(result.customerInfo.entitlements.active[PRO_ENTITLEMENT]);
  if (active) trackEvent('subscription_purchased', { package: aPackage.identifier });
  return active;
}

export async function restorePro() {
  if (!configured) return false;
  const customer = await Purchases.restorePurchases();
  return Boolean(customer.entitlements.active[PRO_ENTITLEMENT]);
}

export const isPurchasesConfigured = () => configured;
