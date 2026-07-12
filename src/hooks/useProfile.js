import { useEffect, useState } from "react"

export const DEFAULT_PROFILE = {
  displayName: "",
  country: "Suriname",
  city: "",
  occupation: "",
  financialPersona: "Beginner",
  preferredCurrency: "SRD",
  missionStatement: "",
}

function storageKey(userId) {
  return `moneyMindProfile_${userId || "guest"}`
}

function loadStoredProfile(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return DEFAULT_PROFILE

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return DEFAULT_PROFILE

    return { ...DEFAULT_PROFILE, ...parsed }
  } catch {
    return DEFAULT_PROFILE
  }
}

// Keyed by the authenticated user's UID so profiles never mix between
// accounts sharing this browser. Edits stay in local state until
// saveProfile() is called.
export default function useProfile(userId) {
  const [profile, setProfile] = useState(() => loadStoredProfile(userId))

  useEffect(() => {
    setProfile(loadStoredProfile(userId))
  }, [userId])

  function updateProfile(key, value) {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  function saveProfile() {
    localStorage.setItem(storageKey(userId), JSON.stringify(profile))
  }

  function resetProfile() {
    setProfile(DEFAULT_PROFILE)
    localStorage.setItem(storageKey(userId), JSON.stringify(DEFAULT_PROFILE))
  }

  return {
    profile,
    updateProfile,
    saveProfile,
    resetProfile,
  }
}
