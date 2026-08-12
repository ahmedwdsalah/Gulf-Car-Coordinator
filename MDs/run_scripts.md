pnpm expo start --dev-client -c
eas build --platform ios --profile development
eas build --platform ios --profile production
eas submit --platform ios

eas.json  >>> "distribution": "internal", "distribution": "store",