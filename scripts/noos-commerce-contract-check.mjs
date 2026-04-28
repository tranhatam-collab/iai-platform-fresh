import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const docsRoot = path.join(workspaceRoot, 'docs', 'noos');
const fixturesRoot = path.join(docsRoot, 'NOOS_COMMERCE_FIXTURES_v0.1');

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function loadYamlSummary(filePath) {
  const rubyScript = `
    require 'json'
    require 'yaml'
    data = YAML.load_file(ARGV[0])
    puts({
      openapi: data["openapi"],
      version: data.dig("info", "version"),
      pathCount: data.fetch("paths").keys.size,
      schemaCount: data.fetch("components").fetch("schemas").keys.size
    }.to_json)
  `;
  return JSON.parse(execFileSync('ruby', ['-e', rubyScript, filePath], { encoding: 'utf8' }));
}

function walkJsonFiles(dirPath) {
  const entries = [];
  for (const name of readdirSync(dirPath)) {
    const fullPath = path.join(dirPath, name);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      entries.push(...walkJsonFiles(fullPath));
      continue;
    }
    if (name.endsWith('.json')) entries.push(fullPath);
  }
  return entries.sort();
}

const schemaPack = loadJson(path.join(docsRoot, 'NOOS_COMMERCE_SCHEMA_PACK_v0.1.json'));
const yamlSummary = loadYamlSummary(path.join(docsRoot, 'NOOS_COMMERCE_OPENAPI_RENDERED.yaml'));
const manifest = loadJson(path.join(fixturesRoot, 'manifest.json'));
const allFixtureFiles = walkJsonFiles(fixturesRoot);
const nonManifestFixtureFiles = allFixtureFiles.filter((filePath) => path.basename(filePath) !== 'manifest.json');
const fixturesReadme = readFileSync(path.join(fixturesRoot, 'README.md'), 'utf8');
const entitlementDoc = readFileSync(
  path.join(docsRoot, '26_NOOS_BUYER_LIBRARY_ENTITLEMENTS_AND_DELIVERY_SYSTEM_2026.md'),
  'utf8'
);

const schemaRegistry = schemaPack.components.schemas;

function resolveSchema(schema) {
  if (!schema) return schema;
  if (schema.$ref) {
    const ref = schema.$ref.replace('#/components/schemas/', '');
    const resolved = schemaRegistry[ref];
    assert.ok(resolved, `Missing schema ref ${schema.$ref}`);
    return resolved;
  }
  return schema;
}

function validateValue(value, schema, breadcrumb) {
  const resolved = resolveSchema(schema);
  assert.ok(resolved, `No schema at ${breadcrumb}`);

  if (resolved.const !== undefined) {
    assert.deepEqual(value, resolved.const, `${breadcrumb}: expected const ${resolved.const}`);
  }

  if (resolved.enum) {
    assert.ok(resolved.enum.includes(value), `${breadcrumb}: expected one of ${resolved.enum.join(', ')}, got ${value}`);
  }

  if (resolved.type) {
    const acceptedTypes = Array.isArray(resolved.type) ? resolved.type : [resolved.type];
    const actualType = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value === 'number' ? (Number.isInteger(value) ? 'integer' : 'number') : typeof value;
    const matches = acceptedTypes.some((type) => {
      if (type === 'number') return actualType === 'number' || actualType === 'integer';
      if (type === 'object') return actualType === 'object' && value !== null && !Array.isArray(value);
      return type === actualType;
    });
    assert.ok(matches, `${breadcrumb}: expected type ${acceptedTypes.join('|')}, got ${actualType}`);
  }

  if (typeof value === 'string') {
    if (resolved.minLength !== undefined) assert.ok(value.length >= resolved.minLength, `${breadcrumb}: minLength ${resolved.minLength}`);
    if (resolved.maxLength !== undefined) assert.ok(value.length <= resolved.maxLength, `${breadcrumb}: maxLength ${resolved.maxLength}`);
    if (resolved.pattern) assert.ok(new RegExp(resolved.pattern).test(value), `${breadcrumb}: pattern ${resolved.pattern}`);
  }

  if (typeof value === 'number') {
    if (resolved.minimum !== undefined) assert.ok(value >= resolved.minimum, `${breadcrumb}: minimum ${resolved.minimum}`);
    if (resolved.maximum !== undefined) assert.ok(value <= resolved.maximum, `${breadcrumb}: maximum ${resolved.maximum}`);
  }

  if (Array.isArray(value)) {
    if (resolved.minItems !== undefined) assert.ok(value.length >= resolved.minItems, `${breadcrumb}: minItems ${resolved.minItems}`);
    if (resolved.items) {
      value.forEach((item, index) => validateValue(item, resolved.items, `${breadcrumb}[${index}]`));
    }
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (resolved.required) {
      for (const key of resolved.required) {
        assert.ok(Object.prototype.hasOwnProperty.call(value, key), `${breadcrumb}: missing required property ${key}`);
      }
    }
    if (resolved.additionalProperties === false && resolved.properties) {
      const allowed = new Set(Object.keys(resolved.properties));
      for (const key of Object.keys(value)) {
        assert.ok(allowed.has(key), `${breadcrumb}: unexpected property ${key}`);
      }
    }
    if (resolved.properties) {
      for (const [key, propertySchema] of Object.entries(resolved.properties)) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          validateValue(value[key], propertySchema, `${breadcrumb}.${key}`);
        }
      }
    }
  }
}

function validateFixtureAgainstSchema(filePath, schema) {
  const value = loadJson(filePath);
  validateValue(value, schema, path.relative(workspaceRoot, filePath));
}

const fixtureSchemaMap = new Map([
  [path.join(fixturesRoot, 'webhooks', 'checkout_session_completed_p11.json'), { $ref: '#/components/schemas/WebhookFulfillmentEvent' }],
  [path.join(fixturesRoot, 'webhooks', 'checkout_session_completed_p11_duplicate.json'), { $ref: '#/components/schemas/WebhookFulfillmentEvent' }],
  [path.join(fixturesRoot, 'entitlements', 'active_ent_master_p11.json'), { $ref: '#/components/schemas/EntitlementRecord' }],
  [path.join(fixturesRoot, 'entitlements', 'active_update_available_vietnam_p07.json'), { $ref: '#/components/schemas/EntitlementRecord' }],
  [path.join(fixturesRoot, 'entitlements', 'expired_updates_only_ent_architecture_p03.json'), { $ref: '#/components/schemas/EntitlementRecord' }],
  [path.join(fixturesRoot, 'entitlements', 'upgraded_ent_master_p11.json'), { $ref: '#/components/schemas/EntitlementRecord' }],
  [path.join(fixturesRoot, 'library', 'library_active_master.json'), { $ref: '#/components/schemas/LibraryView' }],
  [path.join(fixturesRoot, 'library', 'library_expired_updates_architecture.json'), { $ref: '#/components/schemas/LibraryView' }],
  [path.join(fixturesRoot, 'library', 'library_update_available_vietnam.json'), { $ref: '#/components/schemas/LibraryView' }],
  [path.join(fixturesRoot, 'library', 'library_upgraded_master_to_team.json'), { $ref: '#/components/schemas/LibraryView' }],
  [path.join(fixturesRoot, 'catalog', 'product_definitions_all_v1.json'), {
    type: 'object',
    additionalProperties: false,
    required: ['version', 'products'],
    properties: {
      version: { type: 'string' },
      products: {
        type: 'array',
        minItems: 12,
        items: { $ref: '#/components/schemas/ProductDefinition' }
      }
    }
  }]
]);

assert.equal(schemaPack.openapi, '3.1.0', 'JSON schema pack must stay on OpenAPI 3.1.0');
assert.equal(schemaPack.info.version, '0.1.0', 'JSON schema pack version changed unexpectedly');
assert.equal(yamlSummary.openapi, schemaPack.openapi, 'YAML openapi version must match JSON');
assert.equal(yamlSummary.version, schemaPack.info.version, 'YAML info.version must match JSON');
assert.equal(yamlSummary.pathCount, Object.keys(schemaPack.paths).length, 'YAML path count drifted from JSON');
assert.equal(yamlSummary.schemaCount, Object.keys(schemaRegistry).length, 'YAML schema count drifted from JSON');

assert.ok(schemaPack.paths['/products'], 'Missing /products path');
assert.ok(schemaPack.paths['/checkout/sessions'], 'Missing /checkout/sessions path');
assert.ok(schemaPack.paths['/entitlements/{entitlementId}'], 'Missing /entitlements/{entitlementId} path');
assert.ok(schemaPack.paths['/library/{buyerId}'], 'Missing /library/{buyerId} path');
assert.ok(schemaPack.paths['/operations/team4'], 'Missing /operations/team4 path');

for (const group of manifest.fixtureGroups) {
  for (const fixture of group.fixtures) {
    const fullPath = path.join(fixturesRoot, fixture.path);
    assert.ok(allFixtureFiles.includes(fullPath), `Manifest path missing on disk: ${fixture.path}`);
    assert.ok(fixture.id, `Fixture id missing for ${fixture.path}`);
    assert.ok(fixture.purpose, `Fixture purpose missing for ${fixture.path}`);
  }
}

const manifestFixturePaths = manifest.fixtureGroups
  .flatMap((group) => group.fixtures.map((fixture) => fixture.path))
  .sort();
const diskFixturePaths = nonManifestFixtureFiles
  .map((filePath) => path.relative(fixturesRoot, filePath))
  .sort();

assert.deepEqual(
  manifestFixturePaths,
  diskFixturePaths,
  'Fixture manifest must cover every JSON fixture on disk.'
);

const entitlementStates = new Set(
  manifest.fixtureGroups
    .filter((group) => group.group === 'entitlements')
    .flatMap((group) => group.fixtures)
    .map((fixture) => loadJson(path.join(fixturesRoot, fixture.path)).accessStatus)
);

for (const state of entitlementStates) {
  assert.ok(
    entitlementDoc.includes(state),
    `Entitlement doc drifted from fixture state ${state}. Update docs/noos together with the fixture.`
  );
  assert.ok(
    fixturesReadme.includes(`\`${state}\``) || fixturesReadme.includes(state),
    `Fixtures README drifted from entitlement state ${state}. Update docs/noos together with the fixture manifest.`
  );
}

const libraryStates = new Set(
  manifest.fixtureGroups
    .filter((group) => group.group === 'library')
    .flatMap((group) => group.fixtures)
    .map((fixture) => loadJson(path.join(fixturesRoot, fixture.path)).items)
    .flat()
    .map((item) => item.updateStatus)
);

for (const state of libraryStates) {
  assert.ok(
    fixturesReadme.includes(`\`${state}\``) || fixturesReadme.includes(state),
    `Fixtures README drifted from library state ${state}. Update docs/noos together with the fixture manifest.`
  );
}

for (const [filePath, schema] of fixtureSchemaMap.entries()) {
  validateFixtureAgainstSchema(filePath, schema);
}

console.log('NOOS commerce contract check passed');
console.log(JSON.stringify({
  openapi: schemaPack.openapi,
  version: schemaPack.info.version,
  pathCount: Object.keys(schemaPack.paths).length,
  schemaCount: Object.keys(schemaRegistry).length,
  fixtureFilesValidated: allFixtureFiles.length,
  manifestGroups: manifest.fixtureGroups.length
}, null, 2));
