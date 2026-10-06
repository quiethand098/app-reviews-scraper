# App Reviews Scraper: Apple App Store and Google Play

Collect user reviews for any iOS or Android app in one run. Paste app URLs or IDs and get clean rows with rating, text, author, date, app version, and the developer's reply (Google Play).

## Why use it
- **Both stores in one actor**, same output shape (`store` field tells them apart).
- **Complaint mining**: set `maxRating` to 2 and collect only negative reviews.
- **Multi-country App Store** in one run (up to 500 recent reviews per app and country).
- **Thousands of Google Play reviews** per app, newest or most helpful first.
- **No API key, no login, no proxy.** Pay per review.

## Input
| Field | Meaning |
|---|---|
| `appStoreApps` | App Store URLs or numeric IDs |
| `googlePlayApps` | Google Play URLs or package names |
| `countries` | App Store storefronts (`us`, `gb`, `de`...) |
| `language` | Google Play language |
| `sort` | `newest` or `helpful` (Google Play) |
| `maxReviewsPerApp` | Limit per app (per country on the App Store) |
| `minRating` / `maxRating` | Star filter |

## Output example
```json
{ "store": "google_play", "appId": "com.whatsapp", "rating": 1, "text": "...", "date": "2026-10-04T10:12:00.000Z",
  "thumbsUp": 15, "version": "2.26.1", "replyText": null, "url": "https://play.google.com/store/apps/details?id=com.whatsapp" }
```

## Use cases
Product feedback analysis, competitor monitoring, sentiment datasets, feature request mining, ASO research, support triage.

---
Hosted version: https://apify.com/quiethand098/app-reviews-scraper-ios-android
