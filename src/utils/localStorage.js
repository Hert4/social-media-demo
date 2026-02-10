/**
 * Safe localStorage wrapper with JSON serialization.
 * Handles parse errors and missing keys gracefully.
 */

export function getItem(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw !== null ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn(`[localStorage] Failed to save "${key}":`, e)
  }
}

export function removeItem(key) {
  localStorage.removeItem(key)
}
