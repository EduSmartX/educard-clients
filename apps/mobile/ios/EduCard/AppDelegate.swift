import UIKit
import FirebaseCore
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: RCTAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Must run before React Native starts so @react-native-firebase finds the
    // default app (configured from GoogleService-Info.plist).
    FirebaseApp.configure()

    self.moduleName = "EducardMobile"
    self.dependencyProvider = RCTAppDependencyProvider()
    self.initialProps = [:]

    return super.application(
      application,
      didFinishLaunchingWithOptions: launchOptions
    )
  }

  // Links that open the app go to React Native's Linking (see src/lib/app-links.ts):
  // educard://… custom-scheme links ...
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return RCTLinkingManager.application(app, open: url, options: options)
  }

  // ... and Universal Links: a scanned shipment QR (https://<backend>/shipments/<token>/)
  // opens the app when it is installed (domains in EduCard.entitlements).
  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    return RCTLinkingManager.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
