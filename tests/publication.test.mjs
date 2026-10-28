import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync, symlinkSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { assertPublicationReady, exportCandidate, inspectPublication, privacyFindings } from "../scripts/publication.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));

test("privacy findings do not disclose the detected value and preserve upstream notices", () => {
  const address = ["person", "example.invalid"].join("@");
  assert.deepEqual(privacyFindings("README.md", Buffer.from(address)), ["personal-email"]);
  assert.deepEqual(privacyFindings("licenses/SpoolmanDB-MIT.txt", Buffer.from(address)), []);
  const token = "gh" + "p_" + "x".repeat(30);
  assert.deepEqual(privacyFindings("README.md", Buffer.from(token)), ["credential-pattern"]);
  assert.deepEqual(privacyFindings("README.md", Buffer.from("/" + "Users/owner/private")), ["local-user-path"]);
  assert.deepEqual(privacyFindings("README.md", Buffer.from([0, 1])), ["binary-content"]);
});

test("a preparation candidate is distinct from publication authorization", () => {
  const report = inspectPublication(root);
  assert.ok(report.counts.registeredIdentities >= 10357);
  assert.ok(report.files.includes("LICENSE"));
  assert.ok(!report.files.some(file => file.startsWith(".git/")));
  assert.throws(() => assertPublicationReady({ publicationReady: false, pendingSources: ["example"] }), /pending/);
  assert.doesNotThrow(() => assertPublicationReady({ publicationReady: true, pendingSources: [] }));
});

test("export keeps catalog bytes, excludes history/local artifacts, and refuses overwrite or in-checkout output", () => {
  const temporary = mkdtempSync(join(tmpdir(), "registry-publication-"));
  try {
    const report = inspectPublication(root);
    const candidate = join(temporary, "candidate");
    exportCandidate(root, candidate, report);
    for (const file of report.files) assert.deepEqual(readFileSync(join(candidate, file)), readFileSync(join(root, file)), file);
    assert.equal(existsSync(join(candidate, ".git")), false);
    assert.equal(existsSync(join(candidate, "docs")), false);
    assert.throws(() => exportCandidate(root, candidate, report), /exists/);
    assert.throws(() => exportCandidate(root, join(root, "candidate-test"), report), /outside/);
    assert.throws(() => exportCandidate(root, join(root, "..candidate-test"), report), /outside/);
    const linked = join(temporary, "linked");
    symlinkSync(root, linked);
    assert.throws(() => exportCandidate(root, join(linked, "candidate-test"), report), /outside/);
    writeFileSync(join(candidate, "README.md"), ["owner", "example.invalid"].join("@"));
    assert.throws(() => inspectPublication(candidate), /personal-email/);
    writeFileSync(join(candidate, "README.md"), readFileSync(join(root, "README.md")));
    const notice = "licenses/SpoolmanDB-MIT.txt";
    writeFileSync(join(candidate, notice), readFileSync(join(root, notice), "utf8") + "Changed notice\n");
    assert.throws(() => inspectPublication(candidate), /Original upstream notice changed/);
    writeFileSync(join(candidate, notice), readFileSync(join(root, notice)));
    const sources = "licenses/source-decisions.json";
    const decisions = JSON.parse(readFileSync(join(candidate, sources), "utf8"));
    decisions.decisions = decisions.decisions.slice(0, 1);
    writeFileSync(join(candidate, sources), JSON.stringify(decisions));
    assert.throws(() => inspectPublication(candidate), /Missing source disposition/);
  } finally { rmSync(temporary, { recursive: true, force: true }); }
});
