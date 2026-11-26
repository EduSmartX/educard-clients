/**
 * Links that open the app: a shipment QR holds a normal web link,
 * https://<backend>/shipments/<token>/. With the app installed, Android (App Links) and
 * iOS (Universal Links) hand it to the app instead of the browser; educard://shipments/
 * <token> works too (handy for testing). Without the app, the link opens the web page.
 */

import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';

// Tokens are URL-safe base64 (letters, digits, "-" and "_").
const SHIPMENT_LINK = /\/shipments\/([A-Za-z0-9_-]{8,128})\/?(?:[?#].*)?$/;

/** The shipment token in a scanned QR link, or null for any other link. */
export function shipmentTokenFromUrl(url: string | null | undefined) {
  const match = url ? SHIPMENT_LINK.exec(url) : null;
  return match ? match[1] : null;
}

/**
 * The shipment token from the link the app was opened with (cold start) or received
 * while running, until `clear` is called once it has been shown.
 */
export function useShipmentLink() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Linking.getInitialURL().then(url => {
      const found = shipmentTokenFromUrl(url);
      if (active && found) {
        setToken(found);
      }
    });
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const found = shipmentTokenFromUrl(url);
      if (found) {
        setToken(found);
      }
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const clear = useCallback(() => setToken(null), []);
  return { token, clear };
}
