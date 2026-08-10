import assert from "node:assert/strict";
import test from "node:test";

import { programmeAuthAccessDenial } from "../lib/auth/programme-access-policy";
import {
  PROGRAMME_ACCESS_HEADERS,
  PROGRAMME_ACCESS_HEADER_VALUES,
} from "../lib/programme/access-contract";

function headers(values: Record<string, string> = {}) {
  return new Headers(values);
}

const ageHeaders = {
  [PROGRAMME_ACCESS_HEADERS.age]: PROGRAMME_ACCESS_HEADER_VALUES.age,
};

const accountCreationHeaders = {
  ...ageHeaders,
  [PROGRAMME_ACCESS_HEADERS.terms]: PROGRAMME_ACCESS_HEADER_VALUES.terms,
  [PROGRAMME_ACCESS_HEADERS.privacy]: PROGRAMME_ACCESS_HEADER_VALUES.privacy,
};

test("email and Google account creation fail closed without age and current legal-copy authority", async () => {
  const emailWithoutAccess = programmeAuthAccessDenial(headers(), {
    emailAccountCreation: true,
    socialAuthentication: false,
    socialAccountCreation: false,
  });
  assert.ok(emailWithoutAccess);
  assert.equal(emailWithoutAccess.status, 403);
  assert.equal((await emailWithoutAccess.json()).code, "AGE_ATTESTATION_REQUIRED");

  const emailWithoutLegalAuthority = programmeAuthAccessDenial(headers(ageHeaders), {
    emailAccountCreation: true,
    socialAuthentication: false,
    socialAccountCreation: false,
  });
  assert.ok(emailWithoutLegalAuthority);
  assert.equal(emailWithoutLegalAuthority.status, 403);
  assert.equal((await emailWithoutLegalAuthority.json()).code, "ACCOUNT_ACCESS_ACKNOWLEDGEMENT_REQUIRED");

  const googleWithoutAccess = programmeAuthAccessDenial(headers(), {
    emailAccountCreation: false,
    socialAuthentication: true,
    socialAccountCreation: true,
  });
  assert.ok(googleWithoutAccess);
  assert.equal(googleWithoutAccess.status, 403);
  assert.equal((await googleWithoutAccess.json()).code, "AGE_ATTESTATION_REQUIRED");

  const googleWithoutLegalAuthority = programmeAuthAccessDenial(headers(ageHeaders), {
    emailAccountCreation: false,
    socialAuthentication: true,
    socialAccountCreation: true,
  });
  assert.ok(googleWithoutLegalAuthority);
  assert.equal(googleWithoutLegalAuthority.status, 403);
  assert.equal((await googleWithoutLegalAuthority.json()).code, "ACCOUNT_ACCESS_ACKNOWLEDGEMENT_REQUIRED");
});

test("valid account authority passes the wrapper and returning sign-in does not require account-creation acknowledgement", async () => {
  assert.equal(programmeAuthAccessDenial(headers(accountCreationHeaders), {
    emailAccountCreation: true,
    socialAuthentication: false,
    socialAccountCreation: false,
  }), null);
  assert.equal(programmeAuthAccessDenial(headers(), {
    emailAccountCreation: false,
    socialAuthentication: false,
    socialAccountCreation: false,
  }), null, "returning email sign-in does not require account-creation acknowledgement");
  assert.equal(programmeAuthAccessDenial(headers(ageHeaders), {
    emailAccountCreation: false,
    socialAuthentication: true,
    socialAccountCreation: false,
  }), null, "returning Google sign-in keeps the age boundary but not account-creation acknowledgement");
});
