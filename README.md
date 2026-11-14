# Gold & Dollar Rates Pakistan

Today's gold rate per tola in Pakistan (24K/22K/21K) and the US dollar to Pakistani rupee rate, from live market data fetched in the browser at page load, plus currency and gold converters, guides, articles and policy pages. Multi-page static site (built 2026-11-14), deploy to Vercel as-is.

Pages: index, gold-rate, dollar-rate, converter, currencies (index + 4), guides (index + 4), articles (index + 4), faq, about, contact, privacy, terms, dmca + sitemap.xml and robots.txt. Canonicals/sitemap point to https://gold-dollar-rates.vercel.app — update BASE_URL in gold-dollar-rates-build/build.py when a custom domain is connected, then rebuild and redeploy.

## Rate sources (all free, no key, CORS-enabled — verified 2026-11-14)
- Gold spot XAU/USD: primary https://api.gold-api.com/price/XAU, fallback https://latest.currency-api.pages.dev/v1/currencies/xau.json (xau.usd).
- FX (USD base): primary https://open.er-api.com/v6/latest/USD, fallback https://latest.currency-api.pages.dev/v1/currencies/usd.json.
- NOT usable: goldprice.org dbXRates (Forbidden from this VM, even with a browser UA); api.frankfurter.app (works, but has no PKR rate — ECB reference rates only).
- Gold math: 1 tola = 11.6638 g = 0.375 troy oz. Per-tola 24K PKR = XAU_USD x USD_PKR x 0.375; 22K = 24K x 22/24; 21K = 24K x 21/24. No rate is hardcoded anywhere in the HTML.
