import AsyncStorage from "@react-native-async-storage/async-storage";

export const safeGet = async (key, fallback = null) => {
  try {
    const val = await AsyncStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
    return fallback;
  }
};

export const safeSet = async (key, val) => {
  try {
    if (val === null || val === undefined) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, String(val));
    }
  } catch (err) {
    console.warn(`Error writing ${key} to storage:`, err);
  }
};

export const safeGetJSON = async (key, fallback = null) => {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (err) {
    console.warn(`Error parsing ${key} from storage:`, err);
    return fallback;
  }
};

export const safeSetJSON = async (key, val) => {
  try {
    if (val === null || val === undefined) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, JSON.stringify(val));
    }
  } catch (err) {
    console.warn(`Error serializing ${key} to storage:`, err);
  }
};
