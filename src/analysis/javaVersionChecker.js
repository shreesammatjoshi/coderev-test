/**
 * Flags Java code/config that doesn't match the project's required Java
 * version (default: 17, configurable via REQUIRED_JAVA_VERSION in .env).
 *
 * IMPORTANT — what this can and can't actually detect:
 * Java is backwards compatible, so Java 7/8-style code is still perfectly
 * valid *syntax* on Java 17 — there's no parse error to catch. This checker
 * can only do two honest things:
 *
 *  1. Read explicit version declarations out of build files (pom.xml /
 *     build.gradle) — this is a 100% reliable signal when present.
 *  2. Pattern-match on legacy APIs/idioms that are strongly associated with
 *     pre-Java-8 code (Vector, Hashtable, Date/Calendar, raw types, etc.)
 *     and have a well-known modern replacement — this is a heuristic, not
 *     proof of which JDK someone compiled against. It's meant to catch the
 *     common case described: someone copy-pastes old code into the repo.
 */

const DEFAULT_REQUIRED_VERSION = 17;

function getRequiredJavaVersion() {
  const parsed = parseInt(process.env.REQUIRED_JAVA_VERSION, 10);
  return Number.isFinite(parsed) ? parsed : DEFAULT_REQUIRED_VERSION;
}

/**
 * Normalizes the many ways a Java version shows up in build files:
 * "17", "1.8", "VERSION_1_8", "VERSION_17" -> 17 / 8 / 8 / 17
 */
function normalizeJavaVersion(raw) {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^["']|["']$/g, '');

  let m = cleaned.match(/VERSION_1_(\d+)/); // Gradle enum: JavaVersion.VERSION_1_8
  if (m) return parseInt(m[1], 10);

  m = cleaned.match(/VERSION_(\d+)/); // JavaVersion.VERSION_17
  if (m) return parseInt(m[1], 10);

  m = cleaned.match(/^1\.(\d+)$/); // "1.8"
  if (m) return parseInt(m[1], 10);

  m = cleaned.match(/^(\d+)$/); // "8" or "17"
  if (m) return parseInt(m[1], 10);

  return null;
}

const BUILD_FILE_CHECKS = [
  {
    // <maven.compiler.source>1.8</maven.compiler.source> or <maven.compiler.target>8</maven.compiler.target>
    regex: /<maven\.compiler\.(source|target)>\s*([^<]+?)\s*<\/maven\.compiler\.\1>/g,
    kind: 'maven.compiler',
    target: 'pom.xml',
    versionGroup: 2,
  },
  {
    // <release>8</release>
    regex: /<release>\s*([^<]+?)\s*<\/release>/g,
    kind: 'maven.release',
    target: 'pom.xml',
    versionGroup: 1,
  },
  {
    // sourceCompatibility = 1.8 / sourceCompatibility = JavaVersion.VERSION_1_8 / sourceCompatibility("1.8") (Kotlin DSL)
    regex: /(sourceCompatibility|targetCompatibility)\s*(?:=|\()\s*["']?([\w.]+)["']?\)?/g,
    kind: 'gradle.compatibility',
    target: 'build.gradle',
    versionGroup: 2,
  },
];

function checkBuildFileVersion(parsedDiff, requiredVersion) {
  const issues = [];
  const buildFiles = parsedDiff.filter(
    f => /pom\.xml$/i.test(f.filename) || /build\.gradle(\.kts)?$/i.test(f.filename)
  );

  for (const file of buildFiles) {
    const content = file.added_lines.join('\n');

    for (const check of BUILD_FILE_CHECKS) {
      check.regex.lastIndex = 0;
      let match;
      while ((match = check.regex.exec(content)) !== null) {
        const version = normalizeJavaVersion(match[check.versionGroup]);
        if (version !== null && version < requiredVersion) {
          issues.push({
            file: file.filename,
            line: match[0].trim(),
            rule_id: `java-version.${check.kind}`,
            severity: 'medium',
            description:
              `Build configuration targets Java ${version}, but this project requires Java ${requiredVersion}. ` +
              `Update ${check.target} to target Java ${requiredVersion}.`,
            needs_llm: false,
          });
        }
      }
    }
  }

  return issues;
}

// Heuristic legacy-API patterns. Each is tested line-by-line against added
// lines of .java files. Kept deliberately conservative (specific APIs with a
// clear modern replacement) to avoid flagging idiomatic modern code.
function buildLegacyPatterns(requiredVersion) {
  return [
    {
      regex: /\bnew\s+Vector\s*[<(]/,
      message: `Uses \`java.util.Vector\`, a legacy synchronized collection. This project requires Java ${requiredVersion} — prefer \`ArrayList\` (or \`CopyOnWriteArrayList\` if you actually need thread-safety).`,
    },
    {
      regex: /\bnew\s+Hashtable\s*[<(]/,
      message: `Uses \`java.util.Hashtable\`, a legacy synchronized map. This project requires Java ${requiredVersion} — prefer \`HashMap\` (or \`ConcurrentHashMap\` for thread-safety).`,
    },
    {
      regex: /\bEnumeration\s*[<(]/,
      message: `Uses the legacy \`Enumeration\` interface. This project requires Java ${requiredVersion} — prefer \`Iterator\` or an enhanced for-loop.`,
    },
    {
      regex: /\bnew\s+(?:Date|GregorianCalendar)\s*\(/,
      message: `Uses the legacy \`java.util.Date\`/\`Calendar\` API. This project requires Java ${requiredVersion} — prefer \`java.time\` (\`LocalDate\`, \`LocalDateTime\`, \`Instant\`), available since Java 8.`,
    },
    {
      regex: /\b(List|Map|Set|Collection)\s+\w+\s*=\s*new\s+(ArrayList|HashMap|HashSet|LinkedList|TreeMap|TreeSet|Vector|Hashtable)\s*\(\s*\)\s*;/,
      message: `Raw type usage (no generic parameter) — this predates modern Java generics conventions. This project requires Java ${requiredVersion} — add a type parameter, e.g. \`List<String>\`.`,
    },
    {
      regex: /\bnew\s+(Runnable|Comparator|Callable|ActionListener)\s*(?:<[^>]*>)?\s*\(\s*\)\s*\{/,
      message: `Anonymous inner class implementing \`$1\` — this project requires Java ${requiredVersion}, which supports lambdas (since Java 8) for single-method interfaces like this. Consider a lambda expression instead.`,
    },
  ];
}

function checkLegacyJavaPatterns(parsedDiff, requiredVersion) {
  const issues = [];
  const patterns = buildLegacyPatterns(requiredVersion);
  const javaFiles = parsedDiff.filter(f => f.language === 'java' || /\.java$/i.test(f.filename));

  for (const file of javaFiles) {
    for (const line of file.added_lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern.regex);
        if (match) {
          issues.push({
            file: file.filename,
            line: line.trim().slice(0, 200),
            rule_id: 'java-version.legacy-pattern',
            severity: 'medium',
            description: pattern.message.replace('$1', match[1] || ''),
            needs_llm: false,
          });
        }
      }
    }
  }

  return issues;
}

/**
 * @param {Array} parsedDiff - output of diff/parser.js
 * @returns {Array} issue-shaped objects, same shape as securityScanner findings
 */
function checkJavaVersion(parsedDiff) {
  const requiredVersion = getRequiredJavaVersion();
  return [
    ...checkBuildFileVersion(parsedDiff, requiredVersion),
    ...checkLegacyJavaPatterns(parsedDiff, requiredVersion),
  ];
}

module.exports = { checkJavaVersion, getRequiredJavaVersion, normalizeJavaVersion };
