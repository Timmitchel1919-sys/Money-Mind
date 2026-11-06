export const FIREBASE_PRODUCTION_PROJECT_ID = "money-mind-90176"
export const FIREBASE_EMULATOR_PROJECT_ID = "demo-money-mind-e2e"

export function resolveFirebaseRuntimeConfig(environment) {
  const emulatorMode = environment.VITE_FIREBASE_EMULATORS === "true"
  const configuredProjectId = environment.VITE_FIREBASE_PROJECT_ID

  if (emulatorMode && configuredProjectId !== FIREBASE_EMULATOR_PROJECT_ID) {
    throw new Error(
      `[firebase] Emulator mode requires VITE_FIREBASE_PROJECT_ID=${FIREBASE_EMULATOR_PROJECT_ID}. ` +
      "Refusing to initialize Firebase with a production-capable project configuration.",
    )
  }

  return Object.freeze({
    emulatorMode,
    projectId: emulatorMode ? FIREBASE_EMULATOR_PROJECT_ID : FIREBASE_PRODUCTION_PROJECT_ID,
  })
}
