// Push Permission Helper Functions
// OneSignal V16 ile uyumlu localStorage tabanlı kontrol sistemi

/**
 * Push modal'ının gösterilip gösterilmeyeceğini kontrol et
 */
export function shouldShowPushModal(): boolean {
  // Kullanıcı daha önce "Sonra" dediyse 5 gün bekle
  const deniedUntil = localStorage.getItem("push_permission_denied_until");
  if (deniedUntil) {
    const deniedTime = Number(deniedUntil);
    if (Date.now() < deniedTime) {
      console.log("🔔 Push modal 5 gün boyunca gösterilmeyecek");
      return false;
    }
  }

  // Kullanıcı daha önce kalıcı olarak reddetmişse gösterme
  const permanentlyDenied = localStorage.getItem("push_permission_permanently_denied");
  if (permanentlyDenied === "true") {
    console.log("🔔 Push modal kalıcı olarak reddedilmiş");
    return false;
  }

  // Kullanıcı zaten izin vermişse gösterme
  const alreadyGranted = localStorage.getItem("push_permission_granted");
  if (alreadyGranted === "true") {
    console.log("🔔 Push permission zaten verilmiş");
    return false;
  }

  console.log("🔔 Push modal gösterilebilir");
  return true;
}

/**
 * Push permission'ı 5 gün boyunca ertele
 */
export function denyPushForFiveDays(): void {
  const fiveDaysLater = Date.now() + 5 * 24 * 60 * 60 * 1000;
  localStorage.setItem("push_permission_denied_until", fiveDaysLater.toString());
  console.log("🔔 Push permission 5 gün ertelendi:", new Date(fiveDaysLater));
}

/**
 * Push permission'ı kalıcı olarak reddet
 */
export function denyPushPermanently(): void {
  localStorage.setItem("push_permission_permanently_denied", "true");
  localStorage.removeItem("push_permission_denied_until");
  console.log("🔔 Push permission kalıcı olarak reddedildi");
}

/**
 * Push permission verildiğini işaretle
 */
export function markPushPermissionGranted(): void {
  localStorage.setItem("push_permission_granted", "true");
  localStorage.removeItem("push_permission_denied_until");
  localStorage.removeItem("push_permission_permanently_denied");
  console.log("🔔 Push permission verildi olarak işaretlendi");
}

/**
 * Push permission durumunu sıfırla (test için)
 */
export function resetPushPermissionState(): void {
  localStorage.removeItem("push_permission_denied_until");
  localStorage.removeItem("push_permission_permanently_denied");
  localStorage.removeItem("push_permission_granted");
  console.log("🔔 Push permission durumu sıfırlandı");
}

/**
 * Push permission durumunu kontrol et
 */
export function getPushPermissionStatus(): {
  canShow: boolean;
  reason: string;
  deniedUntil?: Date;
} {
  const deniedUntil = localStorage.getItem("push_permission_denied_until");
  const permanentlyDenied = localStorage.getItem("push_permission_permanently_denied");
  const alreadyGranted = localStorage.getItem("push_permission_granted");

  if (alreadyGranted === "true") {
    return { canShow: false, reason: "already_granted" };
  }

  if (permanentlyDenied === "true") {
    return { canShow: false, reason: "permanently_denied" };
  }

  if (deniedUntil) {
    const deniedTime = Number(deniedUntil);
    if (Date.now() < deniedTime) {
      return { 
        canShow: false, 
        reason: "temporarily_denied", 
        deniedUntil: new Date(deniedTime) 
      };
    }
  }

  return { canShow: true, reason: "can_show" };
}