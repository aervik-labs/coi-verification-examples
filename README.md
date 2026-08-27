# COI / ACORD 25 Compliance Verification API — Quickstart

Every general contractor, property manager, and franchisor deals with the same recurring
task: a subcontractor, vendor, or tenant submits a Certificate of Insurance (ACORD 25),
and someone has to check it against the actual contract requirements — minimum liability
limits, additional-insured status, waiver of subrogation, valid policy dates. Done by
hand, this takes 15–45 minutes per document and it's easy to miss something.

This example calls the **COI / ACORD 25 Compliance Verification API** to extract a
certificate's structured data from a local PDF or image file — named insured, insurers,
every coverage section's limits and dates, additional-insured and subrogation-waived
flags. A second endpoint (`/verify`, not shown in the minimal example below) takes the
same document plus your coverage requirements and returns a `compliant`/`deficient`
verdict with an itemized list of what's missing.

**Advisory only, not a substitute for professional review.** Extraction from a scanned,
faxed, or photographed document is never perfect — always check the `confidence` field
before relying on a result, and never treat a "compliant" verdict as a guarantee the
underlying policy is valid or in force.

## Setup

1. Subscribe to the API on RapidAPI:
   https://rapidapi.com/aervik-labs-aervik-labs-default/api/certificate-of-insurance-verification-compliance-check-api
2. On that page, open any endpoint under the **Endpoints** tab — RapidAPI shows your
   personal `X-RapidAPI-Key` there once you're subscribed. Copy it.
3. Set it as an environment variable (never hardcode it in source):

   ```
   export RAPIDAPI_KEY="your-key-here"
   ```
4. Have a certificate file handy (PDF, JPEG, PNG, or WebP) — a blank ACORD 25 template
   works fine to try this out.

## Minimal code

Both quickstarts take a local file path, base64-encode it, and call `POST /parse`.

Python (`python/quickstart.py <path-to-certificate>`, needs `pip install requests`):

```python
import base64, mimetypes, os, requests

RAPIDAPI_HOST = "certificate-of-insurance-verification-compliance-check-api.p.rapidapi.com"

with open("certificate.pdf", "rb") as f:
    b64 = base64.b64encode(f.read()).decode()

resp = requests.post(
    f"https://{RAPIDAPI_HOST}/parse",
    json={"base64_image": b64, "mime_type": "application/pdf"},
    headers={
        "X-RapidAPI-Key": os.environ["RAPIDAPI_KEY"],
        "X-RapidAPI-Host": RAPIDAPI_HOST,
    },
)
print(resp.json())
```

Node 20+ (`node/quickstart.js <path-to-certificate>`, no dependencies — uses native
`fetch`):

```js
import { readFile } from "node:fs/promises";

const RAPIDAPI_HOST = "certificate-of-insurance-verification-compliance-check-api.p.rapidapi.com";
const bytes = await readFile("certificate.pdf");

const res = await fetch(`https://${RAPIDAPI_HOST}/parse`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
    "X-RapidAPI-Host": RAPIDAPI_HOST,
  },
  body: JSON.stringify({ base64_image: bytes.toString("base64"), mime_type: "application/pdf" }),
});
console.log(await res.json());
```

Run either with:

```
RAPIDAPI_KEY=your-key python3 python/quickstart.py ./certificate.pdf
RAPIDAPI_KEY=your-key node node/quickstart.js ./certificate.pdf
```

You can also pass a publicly fetchable URL instead of a local file — `POST /parse`
accepts `{ "file_url": "https://..." }` in place of `base64_image`/`mime_type`.

## Example response

```json
{
  "named_insured": "Acme Contracting LLC",
  "producer": "Big City Insurance Brokers",
  "insurers": [{ "letter": "A", "name": "Statewide Mutual", "naic_number": "12345" }],
  "certificate_holder": "GC Holdings, Inc.",
  "certificate_date": "2026-02-01",
  "general_liability": {
    "insurer_letter": "A",
    "policy_number": "GL123",
    "policy_effective_date": "2026-01-01",
    "policy_expiration_date": "2027-01-01",
    "additional_insured": true,
    "subrogation_waived": true,
    "each_occurrence": 1000000,
    "general_aggregate": 2000000,
    "claims_made": false
  },
  "auto_liability": null,
  "umbrella_excess": null,
  "workers_comp": null,
  "other_coverages": [],
  "confidence": 0.9
}
```

Every coverage section (`general_liability`, `auto_liability`, `umbrella_excess`,
`workers_comp`) is `null` when the certificate doesn't show that section at all — the
extractor never invents a section that isn't there. **Always check `confidence`** before
trusting a result.

## Use cases

- Extract structured data from every COI a subcontractor or vendor submits, instead of
  reading it by hand.
- Check a certificate against your actual contract requirements in one call (`POST
  /verify`) and get an itemized list of exactly what's missing or below minimum.
- Save a reusable requirement profile once (`POST /requirements`) and re-check every
  future certificate for that contract or property against it (`requirements_id`).

## More

- Full docs, pricing tiers, and the endpoint reference (including `/verify` and
  `/requirements`): the RapidAPI listing above (Docs tab).
- Terms of Service / full disclaimer: https://coi.aerviklabs.com/terms

---

Aervik Labs is an AI-native software company — an AI operating agent handles much of the
day-to-day build and support here, under human ownership. Full disclosure at the link above.
