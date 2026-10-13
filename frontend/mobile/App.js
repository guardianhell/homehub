import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, StyleSheet } from "react-native";

import Header from "./src/components/Header";
import EditHouseholdModal from "./src/components/EditHouseholdModal";
import ManageMembersModal from "./src/components/ManageMembersModal";
import DashboardScreen from "./src/screens/DashboardScreen";
import BillsScreen from "./src/screens/BillsScreen";
import AssetsScreen from "./src/screens/AssetsScreen";
import GroceriesScreen from "./src/screens/GroceriesScreen";
import FinanceScreen from "./src/screens/FinanceScreen";
import ActivitiesScreen from "./src/screens/ActivitiesScreen";
import AuthScreen from "./src/screens/AuthScreen";
import api from "./src/services/api";
import {
  safeGetJSON,
  safeSetJSON,
  safeGet,
  safeSet,
} from "./src/utils/storage";
import { STRINGS } from "./src/locales/strings";

const Tab = createBottomTabNavigator();

// Sample Initial Demo Data (Consistent with Web)
const INITIAL_DEMO_HOUSEHOLDS = [
  {
    id: "tebet_free",
    name: "Rumah Utama Keluarga",
    tier: "FREE",
    role: "OWNER",
  },
  { id: "villa_pro", name: "Villa Puncak Indah", tier: "PRO", role: "OWNER" },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [households, setHouseholds] = useState(INITIAL_DEMO_HOUSEHOLDS);
  const [activeHouseholdId, setActiveHouseholdId] = useState("tebet_free");
  const [lang, setLang] = useState("id");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  // Household data state
  const [bills, setBills] = useState([]);
  const [assets, setAssets] = useState([]);
  const [groceries, setGroceries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [members, setMembers] = useState([]);
  const [budgetCeiling, setBudgetCeiling] = useState(10000000);

  const strings = STRINGS[lang] || STRINGS.id;

  // Active household
  const currentHousehold =
    households.find((h) => h.id === activeHouseholdId) ||
    households[0] ||
    INITIAL_DEMO_HOUSEHOLDS[0];

  // Load initial saved user & data
  useEffect(() => {
    (async () => {
      const savedUser = await safeGetJSON("homehub_user");
      const savedHhs = await safeGetJSON("homehub_households");
      const savedActiveId = await safeGet("homehub_active_household_id");
      const savedLang = await safeGet("homehub_lang");

      if (savedLang) setLang(savedLang);
      if (savedHhs && savedHhs.length > 0) setHouseholds(savedHhs);
      if (savedActiveId) setActiveHouseholdId(savedActiveId);
      if (savedUser) setCurrentUser(savedUser);

      // Load active household data
      loadHouseholdData(savedActiveId || "tebet_free");
    })();
  }, []);

  const loadHouseholdData = async (hhId) => {
    if (hhId === "tebet_free") {
      // Demo data
      setBills([
        {
          id: "b1",
          name: "PLN Pascabayar 2200VA",
          utility_type: "ELECTRICITY",
          amount: 450000,
          due_day: 20,
          is_paid: false,
        },
        {
          id: "b2",
          name: "Indihome 50Mbps Fiber",
          utility_type: "INTERNET",
          amount: 380000,
          due_day: 15,
          is_paid: true,
        },
      ]);
      setAssets([
        {
          id: "a1",
          name: "Honda CR-V Turbo Prestige",
          brand_model: "Honda 2022",
          category: "Kendaraan",
          type: "VEHICLE",
          current_odometer: 48500,
          warranty_status: "Garansi Berakhir",
        },
        {
          id: "a2",
          name: "AC Daikin Inverter Flash",
          brand_model: "FTKQ25",
          category: "Elektronik",
          type: "ELECTRONIC",
          warranty_status: "Garansi Aktif",
        },
      ]);
      setGroceries([
        {
          id: "g1",
          name: "Minyak Goreng SunCo 2L",
          category: "Bahan Pokok",
          estimated_price: 36000,
          actual_price: 36000,
          bought: true,
          status: "NORMAL",
          created_by_name: "Siti Aminah",
          bought_by_name: "Budi Santoso",
        },
        {
          id: "g2",
          name: "Beras Pandan Wangi 5kg",
          category: "Bahan Pokok",
          estimated_price: 75000,
          actual_price: null,
          bought: false,
          status: "LOW_STOCK",
          created_by_name: "Mbak Sri",
        },
        {
          id: "g3",
          name: "Kecap Manis Bango 550ml",
          category: "Bumbu Dapur",
          estimated_price: 24000,
          actual_price: null,
          bought: false,
          status: "OUT_OF_STOCK",
          created_by_name: "Siti Aminah",
        },
      ]);
      setExpenses([
        {
          id: "e1",
          title: "Belanja Mingguan Supermarket",
          category: "Belanja",
          amount: 650000,
          date: "10 Sep 2026",
          recorded_by_name: "Budi Santoso",
        },
        {
          id: "e2",
          title: "Servis Rutin AC Daikin",
          category: "Perawatan Rumah",
          amount: 250000,
          date: "04 Sep 2026",
          recorded_by_name: "Siti Aminah",
        },
      ]);
      setActivities([
        {
          id: "act1",
          title: "Les Kumon Matematika Nathan",
          activity_type: "COURSE_LES",
          time: "15:30",
          date: "15 Sep 2026",
          location: "Kumon Tebet Raya",
          created_by_name: "Siti Aminah",
        },
        {
          id: "act2",
          title: "Liburan Akhir Pekan Villa",
          activity_type: "VACATION",
          time: "08:00",
          date: "26 Sep 2026",
          location: "Puncak, Bogor",
          created_by_name: "Budi Santoso",
        },
      ]);
      const defaultMembers = [
        { id: "mem_1", name: currentUser?.name || "Budi Santoso", email: currentUser?.email || "budi.santoso@example.com", role: "OWNER" },
        { id: "mem_2", name: "Siti Aminah", email: "siti.aminah@example.com", role: "ADMIN" },
        { id: "mem_3", name: "Nathan Santoso", email: "nathan@example.com", role: "MEMBER" },
        { id: "mem_4", name: "Mbak Sri", email: "sri.art@example.com", role: "HELPER" },
      ];
      const cached = await safeGetJSON(`homehub_members_${hhId}`);
      setMembers(cached && cached.length > 0 ? cached : defaultMembers);
    } else {
      // Clean slate for new registered accounts
      setBills([]);
      setAssets([]);
      setGroceries([]);
      setExpenses([]);
      setActivities([]);
      const defaultMembers = [
        { id: "mem_owner", name: currentUser?.name || "Owner", email: currentUser?.email || "", role: "OWNER" },
      ];
      const cached = await safeGetJSON(`homehub_members_${hhId}`);
      setMembers(cached && cached.length > 0 ? cached : defaultMembers);
    }

    // Attempt to sync from backend API
    try {
      const res = await api.get(`/auth/households/${hhId}/members`);
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        setMembers(data);
        safeSetJSON(`homehub_members_${hhId}`, data);
      }
    } catch (e) {
      // Offline fallback silent
    }
  };

  const handleAddMember = (newMem) => {
    setMembers((prev) => {
      const updated = [...prev, newMem];
      safeSetJSON(`homehub_members_${activeHouseholdId}`, updated);
      return updated;
    });
  };

  const handleRemoveMember = (memId) => {
    setMembers((prev) => {
      const updated = prev.filter((m) => m.id !== memId);
      safeSetJSON(`homehub_members_${activeHouseholdId}`, updated);
      return updated;
    });
  };

  const handleLoginSuccess = (user, activeHh, allHhs) => {
    setCurrentUser(user);
    safeSetJSON("homehub_user", user);

    if (allHhs && allHhs.length > 0) {
      const normalized = allHhs.map((h) => ({
        ...h,
        tier: h.tier || h.subscription_tier || "FREE",
      }));
      setHouseholds(normalized);
      safeSetJSON("homehub_households", normalized);
    }

    if (activeHh) {
      setActiveHouseholdId(activeHh.id);
      safeSet("homehub_active_household_id", activeHh.id);
      loadHouseholdData(activeHh.id);
    }
  };

  const handleLogout = () => {
    safeSet("homehub_token", null);
    safeSetJSON("homehub_user", null);
    setCurrentUser(null);
  };

  const handleToggleLang = () => {
    const nextLang = lang === "id" ? "en" : "id";
    setLang(nextLang);
    safeSet("homehub_lang", nextLang);
  };

  const handleSelectHousehold = (hhId) => {
    setActiveHouseholdId(hhId);
    safeSet("homehub_active_household_id", hhId);
    loadHouseholdData(hhId);
  };

  const handleUpdateHousehold = async ({ id, name, address }) => {
    const trimmed = name.trim();
    const updated = households.map((h) =>
      h.id === id
        ? {
            ...h,
            name: trimmed,
            ...(address !== undefined ? { address } : {}),
          }
        : h,
    );
    setHouseholds(updated);
    safeSetJSON("homehub_households", updated);

    // Call API if not purely demo
    try {
      if (id !== "tebet_free" && id !== "villa_pro") {
        await api.put(`/auth/households/${id}`, {
          name: trimmed,
          address: address || null,
        });
      }
    } catch (err) {
      console.warn("API update household warning:", err);
    }
  };

  const handleToggleGrocery = (id) => {
    setGroceries((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              bought: !g.bought,
              bought_by_name: !g.bought ? (currentUser?.name || "Budi Santoso") : null,
            }
          : g,
      ),
    );
  };

  const handleToggleBill = (id) => {
    setBills((prev) =>
      prev.map((b) => (b.id === id ? { ...b, is_paid: !b.is_paid } : b)),
    );
  };

  if (!currentUser) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0c1322" }}>
          <StatusBar style="light" />
          <AuthScreen onLoginSuccess={handleLoginSuccess} lang={lang} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <StatusBar style="dark" />

        {/* Global Mobile Header */}
        <Header
          household={currentHousehold}
          households={households}
          onSelectHousehold={handleSelectHousehold}
          onOpenEditModal={() => setIsEditModalOpen(true)}
          onOpenMembersModal={() => setIsMembersModalOpen(true)}
          membersCount={members.length}
          lang={lang}
          onToggleLang={handleToggleLang}
          onLogout={handleLogout}
        />

        {/* Tab Navigation */}
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: "#4f46e5",
              tabBarInactiveTintColor: "#94a3b8",
              tabBarStyle: styles.tabBar,
              tabBarLabelStyle: styles.tabBarLabel,
              tabBarIcon: ({ color, focused }) => {
                let icon = "🏠";
                if (route.name === "dashboard") icon = "🏠";
                if (route.name === "bills") icon = "⚡";
                if (route.name === "assets") icon = "❄️";
                if (route.name === "groceries") icon = "🛒";
                if (route.name === "finance") icon = "💰";
                if (route.name === "activities") icon = "📅";
                return (
                  <Text style={{ fontSize: focused ? 18 : 16 }}>{icon}</Text>
                );
              },
            })}
          >
            <Tab.Screen
              name="dashboard"
              options={{ title: strings.tabs.dashboard }}
            >
              {(props) => (
                <DashboardScreen
                  {...props}
                  household={currentHousehold}
                  bills={bills}
                  assets={assets}
                  groceries={groceries}
                  expenses={expenses}
                  activities={activities}
                  members={members}
                  onOpenMembersModal={() => setIsMembersModalOpen(true)}
                  budgetCeiling={budgetCeiling}
                  lang={lang}
                />
              )}
            </Tab.Screen>

            <Tab.Screen name="bills" options={{ title: strings.tabs.bills }}>
              {(props) => (
                <BillsScreen
                  {...props}
                  bills={bills}
                  onToggleBill={handleToggleBill}
                  lang={lang}
                />
              )}
            </Tab.Screen>

            <Tab.Screen name="assets" options={{ title: strings.tabs.assets }}>
              {(props) => (
                <AssetsScreen {...props} assets={assets} lang={lang} />
              )}
            </Tab.Screen>

            <Tab.Screen
              name="groceries"
              options={{ title: strings.tabs.groceries }}
            >
              {(props) => (
                <GroceriesScreen
                  {...props}
                  groceries={groceries}
                  onToggleItem={handleToggleGrocery}
                  members={members}
                  currentUser={currentUser}
                  lang={lang}
                />
              )}
            </Tab.Screen>

            <Tab.Screen
              name="finance"
              options={{ title: strings.tabs.finance }}
            >
              {(props) => (
                <FinanceScreen
                  {...props}
                  expenses={expenses}
                  budgetCeiling={budgetCeiling}
                  members={members}
                  currentUser={currentUser}
                  lang={lang}
                />
              )}
            </Tab.Screen>

            <Tab.Screen
              name="activities"
              options={{ title: strings.tabs.activities }}
            >
              {(props) => (
                <ActivitiesScreen
                  {...props}
                  activities={activities}
                  members={members}
                  currentUser={currentUser}
                  lang={lang}
                />
              )}
            </Tab.Screen>
          </Tab.Navigator>
        </NavigationContainer>

        {/* Edit Household Name Modal */}
        <EditHouseholdModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          household={currentHousehold}
          onSave={handleUpdateHousehold}
          lang={lang}
        />

        {/* Manage Household Members Modal */}
        <ManageMembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          household={currentHousehold}
          members={members}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          lang={lang}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  tabBar: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: "700",
  },
});
