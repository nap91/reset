# Reset subscriptions

Reset uses Apple In-App Purchase through RevenueCat. Stripe is not used inside the iOS app for digital feature access.

## MVP offer

- Three free AI-generated room plans per account
- Reset Pro monthly: proposed launch price USD 5.99
- Reset Pro annual: proposed launch price USD 39.99
- Entitlement identifier: `reset_pro`

Prices shown before store configuration are preview copy. App Store Connect remains the source of truth for localized prices.

## Required account configuration

1. Enroll in the Apple Developer Program and create the Reset app in App Store Connect.
2. Create one auto-renewable subscription group with monthly and annual products.
3. Create a RevenueCat project and iOS app, then connect App Store Connect.
4. Create the `reset_pro` entitlement, attach both products, and add them to the current offering.
5. Add the public iOS RevenueCat SDK key as `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`.
6. Build an Expo development client and test purchases using an Apple sandbox tester.

The paywall includes purchase restoration. Before App Review, replace the temporary Terms and Privacy labels with working URLs and confirm all subscription disclosures against the configured store products.
