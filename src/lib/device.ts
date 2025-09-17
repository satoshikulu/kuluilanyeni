// Basit cihaz kimliği (localStorage)
// Üret: stable UUID benzeri random id
export function getDeviceId(): string {
  const KEY = 'app_device_id'
  try {
    const existing = localStorage.getItem(KEY)
    if (existing && existing.length > 0) return existing
  } catch {}
  const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
  try { localStorage.setItem(KEY, id) } catch {}
  return id
}
