#!/usr/bin/env python3
"""
Quickstart: COI / ACORD 25 Compliance Verification API (via RapidAPI)

Extracts a Certificate of Insurance's structured data (named insured, insurers, every
coverage section's limits and dates, additional-insured/subrogation-waived flags) from a
local PDF or image file.

Advisory only, not a substitute for professional review. Extraction from a scanned,
faxed, or photographed document is never perfect -- always check the `confidence` field
before relying on a result.

Setup:
    pip install requests
    export RAPIDAPI_KEY="your-rapidapi-key"

Subscribe and get your key:
    https://rapidapi.com/aervik-labs-aervik-labs-default/api/certificate-of-insurance-verification-compliance-check-api

Usage:
    python3 quickstart.py <path-to-certificate.pdf|.jpg|.png|.webp>
"""
import base64
import mimetypes
import os
import sys

import requests

RAPIDAPI_HOST = "certificate-of-insurance-verification-compliance-check-api.p.rapidapi.com"
BASE_URL = f"https://{RAPIDAPI_HOST}"

# The API accepts these mime types for base64_image; default to image/jpeg if guessing fails.
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"}


def parse_certificate(file_path: str) -> dict:
    api_key = os.environ.get("RAPIDAPI_KEY")
    if not api_key:
        sys.exit("Set the RAPIDAPI_KEY environment variable first -- see this script's docstring.")

    with open(file_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")

    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type not in ALLOWED_MIME_TYPES:
        mime_type = "image/jpeg"

    resp = requests.post(
        f"{BASE_URL}/parse",
        json={"base64_image": b64, "mime_type": mime_type},
        headers={
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": RAPIDAPI_HOST,
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("Usage: python3 quickstart.py <path-to-certificate.pdf|.jpg|.png|.webp>")

    data = parse_certificate(sys.argv[1])

    print(f"Named insured: {data.get('named_insured')}")
    print(f"Certificate holder: {data.get('certificate_holder')}")
    print(f"Confidence: {data.get('confidence')}")

    if data.get("confidence") is not None and data["confidence"] < 0.5:
        print(f"\nWARNING: low confidence extraction ({data['confidence']}); review before use.")

    gl = data.get("general_liability")
    if gl:
        print(f"\nGeneral liability: each_occurrence=${gl.get('each_occurrence')}, "
              f"additional_insured={gl.get('additional_insured')}, "
              f"expires={gl.get('policy_expiration_date')}")
    else:
        print("\nNo general_liability section found on this certificate.")


if __name__ == "__main__":
    main()
