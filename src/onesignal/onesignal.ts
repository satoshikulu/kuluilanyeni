// OneSignal V16 Integration
// This file provides the correct V16 API integration

// Global enablePush function using correct V16 API
window.enablePush = async () => {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal: any) {
    try {
      // V16 API: Request notification permission
      await OneSignal.Notifications.requestPermission();
      
      // V16 API: Enable push notifications
      await OneSignal.User.Push.enable();
      
      console.log("Push enabled successfully!");
    } catch (e) {
      console.error("Push enable error:", e);
    }
  });
};

export {};