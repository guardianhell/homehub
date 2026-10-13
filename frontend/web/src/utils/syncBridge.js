/**
 * HomeHub Live Synchronization Bridge
 * Provides seamless 2-way real-time data synchronization between the User Web Application (port 5173)
 * and the Admin BackOffice Dashboard (port 5174) on localhost.
 * 
 * Synchronizes:
 * 1. Active User Profile & Authentication Status
 * 2. Households (Tenants) with live counts (Members, Bills, Assets, Groceries, Expenses)
 * 3. Subscription & Upgrade Status (PRO / FREE)
 * 4. Payment Transactions & Orders (GoPay, OVO, QRIS, Voucher)
 * 5. Voucher Generation & Quota Claims
 * 6. Admin Actions (Manual PRO activation, Downgrades, User Suspension)
 */

import { safeGetJSON, safeSetJSON } from './safeStorage';

const LIVE_STATE_COOKIE = 'homehub_live_sync_state';
const ADMIN_ACTION_COOKIE = 'homehub_admin_action_event';
const VOUCHERS_COOKIE = 'homehub_admin_vouchers_sync';

let broadcastChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('homehub_live_sync_bus');
  }
} catch (e) {
  // BroadcastChannel unavailable
}

/**
 * Read cookie by name with URI decoding
 */
export function getCrossPortCookie(name) {
  try {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    if (!match || !match[1]) return null;
    const decoded = decodeURIComponent(match[1]);
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}

/**
 * Set cookie across localhost ports (SameSite=Lax, path=/)
 */
export function setCrossPortCookie(name, data, days = 30) {
  try {
    if (typeof document === 'undefined') return;
    const jsonStr = JSON.stringify(data);
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    
    // Set for localhost domain and default path
    document.cookie = `${name}=${encodeURIComponent(jsonStr)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn(`[syncBridge] Failed to set cookie "${name}":`, e);
  }
}

/**
 * Collect and broadcast the live user state snapshot to Admin Dashboard
 */
export function broadcastLiveUserState({ user, households, activeHouseholdId }) {
  try {
    if (typeof window === 'undefined') return;

    const currentUser = user || safeGetJSON('homehub_user', null) || {
      id: 'usr-calvin-01',
      name: 'Calvin Tantio',
      email: 'calvin@homehub.app',
      phone: '0812-3456-7890',
      status: 'ACTIVE',
      created_at: '2026-01-10T08:30:00Z',
      preferred_language: 'id'
    };

    const currentHouseholds = Array.isArray(households) && households.length > 0 
      ? households 
      : safeGetJSON('homehub_households', [
          { id: 'tebet_free', name: 'Rumah Tebet (Utama)', tier: 'FREE', role: 'OWNER' },
          { id: 'villa_pro', name: 'Villa Puncak', tier: 'PRO', role: 'OWNER' }
        ]);

    // Gather live metadata for each household
    const enrichedHouseholds = currentHouseholds.map(hh => {
      const hhId = hh.id;
      const members = safeGetJSON(`homehub_members_${hhId}`, []);
      const bills = safeGetJSON(`homehub_bills_${hhId}`, []);
      const assets = safeGetJSON(`homehub_assets_${hhId}`, []);
      const groceries = safeGetJSON(`homehub_groceries_${hhId}`, []);
      const expenses = safeGetJSON(`homehub_expenses_${hhId}`, []);

      const membersCount = Array.isArray(members) && members.length > 0 ? members.length : 1;
      const billsCount = Array.isArray(bills) ? bills.length : 0;
      const assetsCount = Array.isArray(assets) ? assets.length : 0;
      const groceriesCount = Array.isArray(groceries) ? groceries.length : 0;
      const expensesCount = Array.isArray(expenses) ? expenses.length : 0;

      return {
        id: hh.id,
        name: hh.name,
        owner_id: currentUser.id,
        owner_name: currentUser.name,
        owner_email: currentUser.email,
        address: hh.address || (hh.id.includes('villa') ? 'Komplek Green Hill Blok C-4, Puncak, Bogor' : 'Jl. Tebet Barat Dalam No. 12, Tebet, Jakarta Selatan'),
        subscription_tier: hh.tier === 'PRO' || hh.subscription_tier === 'PRO' ? 'PRO' : 'FREE',
        subscription_status: hh.subscription_status || 'ACTIVE',
        pro_valid_until: hh.pro_valid_until || (hh.tier === 'PRO' ? '2027-01-15T10:00:00Z' : null),
        active_members_count: membersCount,
        bills_count: billsCount,
        assets_count: assetsCount,
        groceries_count: groceriesCount,
        expenses_count: expensesCount,
        created_at: hh.created_at || '2026-01-10T08:30:00Z',
        is_live_active: hh.id === activeHouseholdId
      };
    });

    // Gather flattened active household members
    const allMembers = [];
    currentHouseholds.forEach(hh => {
      const members = safeGetJSON(`homehub_members_${hh.id}`, []);
      if (Array.isArray(members)) {
        members.forEach(m => {
          if (!allMembers.some(existing => existing.id === m.id || (m.email && existing.email === m.email))) {
            allMembers.push({
              id: m.id,
              name: m.name,
              email: m.email,
              role: m.role || 'MEMBER',
              household_id: hh.id,
              household_name: hh.name,
              tier: hh.tier || 'FREE',
              status: m.status || 'ACTIVE'
            });
          }
        });
      }
    });

    // Gather payment orders
    const paymentOrders = safeGetJSON('homehub_payment_orders', []);

    // Build the unified compact live state
    const liveState = {
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone || '0812-3456-7890',
        status: currentUser.status || 'ACTIVE',
        preferred_language: currentUser.preferred_language || 'id',
        created_at: currentUser.created_at || '2026-01-10T08:30:00Z',
        last_active: new Date().toISOString()
      },
      activeHouseholdId,
      households: enrichedHouseholds,
      members: allMembers,
      orders: paymentOrders.slice(0, 10),
      timestamp: Date.now()
    };

    // Save to shared cross-port cookie
    setCrossPortCookie(LIVE_STATE_COOKIE, liveState);

    // Save to localStorage as local mirror
    safeSetJSON(LIVE_STATE_COOKIE, liveState);

    // Broadcast through BroadcastChannel if open
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type: 'LIVE_STATE_UPDATE', payload: liveState });
      } catch (e) {}
    }

    // Trigger local DOM event
    window.dispatchEvent(new CustomEvent('homehub_live_state_broadcast', { detail: liveState }));
  } catch (err) {
    console.warn('[syncBridge] Error broadcasting live user state:', err);
  }
}

/**
 * Record a new completed payment/order from user app
 */
export function recordUserPaymentOrder(order) {
  try {
    const existing = safeGetJSON('homehub_payment_orders', []);
    const formattedOrder = {
      id: order.order_id || order.id || `ORD-${Date.now()}`,
      household_id: order.household_id,
      household_name: order.household_name || 'Rumah',
      user_name: order.user_name || 'User',
      user_email: order.user_email || 'user@homehub.app',
      plan_type: order.plan_type || 'PRO_YEARLY',
      amount: order.final_amount || order.amount || 470000,
      payment_method: order.payment_method || 'GOPAY',
      payment_gateway_ref: order.payment_gateway_ref || order.order_id || `PG-${Date.now()}`,
      status: 'PAID',
      started_at: new Date().toISOString(),
      expires_at: order.expires_at || new Date(Date.now() + 365 * 864e5).toISOString(),
      created_at: new Date().toISOString()
    };

    const updated = [formattedOrder, ...existing.filter(o => o.id !== formattedOrder.id)].slice(0, 20);
    safeSetJSON('homehub_payment_orders', updated);

    // Set cookie specifically for orders
    setCrossPortCookie('homehub_live_orders_sync', updated);

    // Trigger state broadcast
    const user = safeGetJSON('homehub_user', null);
    const households = safeGetJSON('homehub_households', []);
    broadcastLiveUserState({ user, households });

    return formattedOrder;
  } catch (e) {
    console.warn('[syncBridge] Failed to record payment order:', e);
    return null;
  }
}

/**
 * Listen for Admin BackOffice Actions (e.g. Activate PRO, Downgrade, Suspend User)
 */
export function listenForAdminSyncActions(onActionReceived) {
  if (typeof window === 'undefined') return () => {};

  let lastProcessedTimestamp = safeGetJSON('homehub_last_processed_admin_action', 0);

  const checkActionCookie = () => {
    try {
      const action = getCrossPortCookie(ADMIN_ACTION_COOKIE);
      if (action && action.timestamp && action.timestamp > lastProcessedTimestamp) {
        lastProcessedTimestamp = action.timestamp;
        safeSetJSON('homehub_last_processed_admin_action', lastProcessedTimestamp);
        if (typeof onActionReceived === 'function') {
          onActionReceived(action);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  // Immediate check on initialization
  checkActionCookie();

  // Check on window focus (user switches tabs from Admin to Web app)
  const handleFocus = () => {
    checkActionCookie();
  };
  window.addEventListener('focus', handleFocus);

  // Listen on BroadcastChannel if available
  const handleBroadcastMessage = (event) => {
    if (event?.data?.type === 'ADMIN_ACTION' && event?.data?.payload) {
      const action = event.data.payload;
      if (action.timestamp && action.timestamp > lastProcessedTimestamp) {
        lastProcessedTimestamp = action.timestamp;
        safeSetJSON('homehub_last_processed_admin_action', lastProcessedTimestamp);
        if (typeof onActionReceived === 'function') {
          onActionReceived(action);
        }
      }
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('focus', handleFocus);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
  };
}

/**
 * Get active vouchers shared from Admin Dashboard
 */
export function getSynchronizedVouchers() {
  const fromCookie = getCrossPortCookie(VOUCHERS_COOKIE);
  if (Array.isArray(fromCookie) && fromCookie.length > 0) {
    return fromCookie;
  }
  return safeGetJSON('homehub_admin_vouchers', []);
}

/**
 * Record a voucher claim from user app back to Admin Dashboard
 */
export function recordVoucherClaim({ voucherCode, user, household, planType, finalPrice, discountAmount }) {
  try {
    const vouchers = getSynchronizedVouchers();
    const cleanCode = (voucherCode || '').trim().toUpperCase();
    let idx = vouchers.findIndex(v => v.code.toUpperCase() === cleanCode);

    if (idx === -1) {
      vouchers.unshift({
        id: `vouch-${cleanCode}`,
        code: cleanCode,
        description: `Voucher ${cleanCode}`,
        discount_type: 'PERCENTAGE',
        discount_value: 0,
        target_plan: planType || 'ALL',
        max_quota: 10,
        claimed_count: 0,
        status: 'ACTIVE',
        valid_until: new Date(Date.now() + 90 * 864e5).toISOString(),
        generated_by_name: 'Admin',
        claims: []
      });
      idx = 0;
    }
      const v = vouchers[idx];
      v.claimed_count = (v.claimed_count || 0) + 1;
      if (v.claimed_count >= v.max_quota) {
        v.status = 'EXHAUSTED';
      }
      const claimItem = {
        id: `clm-${Date.now()}`,
        user_id: user?.id || 'usr-active',
        user_name: user?.name || 'User',
        user_email: user?.email || 'user@homehub.app',
        household_id: household?.id,
        household_name: household?.name,
        claimed_at: new Date().toISOString(),
        applied_plan: planType,
        original_price: planType === 'PRO_MONTHLY' ? 49000 : 470000,
        discount_amount: discountAmount,
        final_price: finalPrice
      };
      if (!v.claims) v.claims = [];
      v.claims.unshift(claimItem);
      vouchers[idx] = v;

      // Update cookie & local storage
      setCrossPortCookie(VOUCHERS_COOKIE, vouchers);
      safeSetJSON('homehub_admin_vouchers', vouchers);

      // Broadcast
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'VOUCHER_CLAIMED', payload: { voucherCode: cleanCode, claim: claimItem } });
      }

      return { success: true, voucher: v };
  } catch (err) {
    console.warn('[syncBridge] Error recording voucher claim:', err);
  }
  return { success: false };
}
