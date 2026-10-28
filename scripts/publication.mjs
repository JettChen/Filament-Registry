import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { sha256, validateRegistry } from "./registry.mjs";

const fixedFiles = [
  "README.md", "CONTRIBUTING.md", "CHANGELOG.md", "PUBLICATION.md", "LICENSE", "THIRD_PARTY_NOTICES.md",
  "licenses/SpoolmanDB-MIT.txt", "licenses/AGPL-3.0.txt", "licenses/source-decisions.json",
  "licenses/upstream/BambuStudio-804d93b.json", "licenses/upstream/BambuStudio-79df7ae.json", "licenses/upstream/Snapmaker-Orca-b1831e5.json",
  ".github/CODEOWNERS", ".github/pull_request_template.md", ".github/workflows/validate.yml",
  "scripts/registry.mjs", "scripts/compatibility.mjs", "scripts/validate.mjs", "scripts/check-update.mjs",
  "scripts/update-manifest.mjs", "scripts/publication.mjs",
  "tests/registry.test.mjs", "tests/compatibility.test.mjs", "tests/publication.test.mjs", "registry.json",
];
const originalNotices = new Set(["licenses/SpoolmanDB-MIT.txt", "licenses/AGPL-3.0.txt"]);
const noticeHashes = {
  "licenses/upstream/BambuStudio-804d93b.json": "5af6c01befa0a3cd67b604869671ce05a1caf4df2bf473df644554ce98d559b4",
  "licenses/upstream/BambuStudio-79df7ae.json": "5af6c01befa0a3cd67b604869671ce05a1caf4df2bf473df644554ce98d559b4",
  "licenses/upstream/Snapmaker-Orca-b1831e5.json": "97809e583c6bd83ca9f78fcd806c60991de2f7d8953a86375140541bb4adc673",
  "licenses/SpoolmanDB-MIT.txt": "0e32583112190cdace7fcba056c3ccadc1e4952b6fa0f6210c8e6faa8048411e",
  "licenses/AGPL-3.0.txt": "57c8ff33c9c0cfc3ef00e650a1cc910d7ee479a8bc509f6c9209a7c2a11399d6",
};

/** Return categories only: CI output must never echo the detected value. */
export function privacyFindings(file, bytes) {
  const text = bytes.toString("utf8");
  const findings = [];
  if (bytes.includes(0)) findings.push("binary-content");
  try { new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { findings.push("invalid-encoding"); }
  if (/(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(text)) findings.push("credential-pattern");
  if (/\/(?:Users|Volumes)\/[^\s"'<>]+|[A-Z]:\\Users\\/.test(text)) findings.push("local-user-path");
  if (!originalNotices.has(file) && /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) findings.push("personal-email");
  return findings;
}

export function inspectPublication(root) {
  const { manifest } = validateRegistry(root);
  const files = [...fixedFiles, ...Object.keys(manifest.files).map(file => `data/${file}`)].sort();
  const problems = [];
  for (const file of files) {
    // Check every path component so a directory symlink cannot hide behind a regular file.
    let path = root;
    for (const part of file.split("/")) {
      path = join(path, part);
      if (lstatSync(path).isSymbolicLink()) throw new Error(`Publication symlink rejected: ${file}`);
    }
    if (!lstatSync(path).isFile()) throw new Error(`Publication file required: ${file}`);
    for (const category of privacyFindings(file, readFileSync(path))) problems.push({ file, category });
  }
  if (problems.length) throw new Error(`Publication privacy check failed: ${JSON.stringify(problems)}`);
  for (const [file, expected] of Object.entries(noticeHashes)) {
    if (sha256(readFileSync(join(root, file))) !== expected) throw new Error(`Original upstream notice changed: ${file}`);
  }
  const mit = readFileSync(join(root, "licenses/SpoolmanDB-MIT.txt"), "utf8");
  const projectMit = mit.replace("Copyright (c) 2024 Donkie", "Copyright (c) 2026 JettChen and contributors");
  if (!mit.includes("Copyright (c) 2024 Donkie") || readFileSync(join(root, "LICENSE"), "utf8") !== projectMit) throw new Error("Complete standard MIT text and original copyright notice required");
  const sources = JSON.parse(readFileSync(join(root, "licenses/source-decisions.json"), "utf8"));
  if (sources.format !== "ussa-filament-publication-sources/1" || !Array.isArray(sources.decisions) || !sources.decisions.length) throw new Error("Invalid publication source decisions");
  const ids = new Set();
  for (const item of sources.decisions) {
    if (!/^[a-z0-9-]+$/.test(item.id) || ids.has(item.id) || !item.basis?.trim() || !["notice-carried", "factual-scope-recorded", "permission-recorded", "pending-scope-review"].includes(item.status)) throw new Error("Invalid source disposition");
    ids.add(item.id);
    if (item.status === "permission-recorded" && !/^https:\/\//.test(item.evidenceUrl ?? "")) throw new Error(`Public permission evidence URL required: ${item.id}`);
    if (item.notice && !originalNotices.has(item.notice)) throw new Error(`Unknown notice: ${item.id}`);
    if (item.status === "notice-carried" && !item.notice) throw new Error(`Missing original notice: ${item.id}`);
  }
  for (const id of ["spoolmandb", "software-palettes", "filamentcolors", "manufacturer-tables", "other-source-references"]) {
    if (!ids.has(id)) throw new Error(`Missing source disposition: ${id}`);
  }
  const pendingSources = sources.decisions.filter(item => item.status === "pending-scope-review").map(item => item.id);
  return { catalogVersion: manifest.catalogVersion, counts: manifest.counts, files, privacy: "passed", pendingSources, publicationReady: pendingSources.length === 0 };
}

export function assertPublicationReady(report) {
  if (!report.publicationReady) throw new Error(`Publication scope decisions pending: ${report.pendingSources.join(", ")}`);
}

export function exportCandidate(root, destination, report) {
  if (existsSync(destination)) throw new Error("Publication destination already exists");
  const source = realpathSync(root);
  const target = join(realpathSync(dirname(resolve(destination))), basename(destination));
  const fromSource = relative(source, target);
  if (!fromSource || (!(fromSource === ".." || fromSource.startsWith(`..${sep}`)) && !isAbsolute(fromSource))) throw new Error("Export outside the source checkout");
  mkdirSync(target);
  for (const file of report.files) {
    mkdirSync(dirname(join(target, file)), { recursive: true });
    copyFileSync(join(root, file), join(target, file));
  }
  writeFileSync(join(target, "publication-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  return target;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const args = process.argv.slice(2);
  const ready = args[0] === "--ready" && args.length === 1;
  const exporting = args[0] === "--export" && args.length === 2;
  if (args.length && !ready && !exporting) throw new Error("Usage: node scripts/publication.mjs [--ready | --export <new-directory>]");
  const report = inspectPublication(root);
  if (ready) assertPublicationReady(report);
  if (exporting) exportCandidate(root, args[1], report);
  console.log(JSON.stringify(report, null, 2));
}
