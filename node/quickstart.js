#!/usr/bin/env node
/**
 * Quickstart: COI / ACORD 25 Compliance Verification API (via RapidAPI)
 *
 * Extracts a Certificate of Insurance's structured data (named insured, insurers, every
 * coverage section's limits and dates, additional-insured/subrogation-waived flags) from a
 * local PDF or image file.
 *
 * Advisory only, not a substitute for professional review. Extraction from a scanned,
 * faxed, or photographed document is never perfect -- always check the `confidence` field
 * before relying on a result.
 *
 * Setup:
 *   export RAPIDAPI_KEY="your-rapidapi-key"
 *
 * Subscribe and get your key:
 *   https://rapidapi.com/aervik-labs-aervik-labs-default/api/certificate-of-insurance-verification-compliance-check-api
 *
 * Requires Node 20+ (native fetch, no dependencies).
 *
 * Usage:
 *   node quickstart.js <path-to-certificate.pdf|.jpg|.png|.webp>
 */

import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const RAPIDAPI_HOST = 'certificate-of-insurance-verification-compliance-check-api.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
};

async function parseCertificate(filePath) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.error('Set the RAPIDAPI_KEY environment variable first -- see this file\'s header comment.');
    process.exit(1);
  }

  const bytes = await readFile(filePath);
  const base64Image = bytes.toString('base64');
  const mimeType = MIME_TYPES[extname(filePath).toLowerCase()] ?? 'image/jpeg';

  const res = await fetch(`${BASE_URL}/parse`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    },
    body: JSON.stringify({ base64_image: base64Image, mime_type: mimeType }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`POST /parse failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node quickstart.js <path-to-certificate.pdf|.jpg|.png|.webp>');
    process.exit(1);
  }

  const data = await parseCertificate(filePath);

  console.log(`Named insured: ${data.named_insured}`);
  console.log(`Certificate holder: ${data.certificate_holder}`);
  console.log(`Confidence: ${data.confidence}`);

  if (data.confidence != null && data.confidence < 0.5) {
    console.warn(`\nWARNING: low confidence extraction (${data.confidence}); review before use.`);
  }

  if (data.general_liability) {
    const gl = data.general_liability;
    console.log(
      `\nGeneral liability: each_occurrence=$${gl.each_occurrence}, additional_insured=${gl.additional_insured}, expires=${gl.policy_expiration_date}`
    );
  } else {
    console.log('\nNo general_liability section found on this certificate.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
