const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const should = require('should');

const SPEC_PATH = path.join(__dirname, '../../../../assets/swaggerV1.yaml');
const METHODS = ['get', 'post', 'put', 'patch', 'delete'];
// Policies that reject a request without a bearer token.
const AUTH_POLICIES = ['tokenAuth', 'mfaEnrollmentAuth'];
const API_PREFIX = '/api/v1';

// '/api/v1/caves/:caveId/' and '/caves/{caveId}' both become '/caves/{}'.
const templateOf = (routePath) =>
  routePath
    .replace(/\/$/, '')
    .replace(/:\w+/g, '{}')
    .replace(/\{\w+\}/g, '{}');

const resolvePointer = (spec, ref) =>
  ref
    .slice(2)
    .split('/')
    .reduce((node, key) => (node === undefined ? undefined : node[key]), spec);

const collectRefs = (node, refs = []) => {
  if (Array.isArray(node)) node.forEach((n) => collectRefs(n, refs));
  else if (node && typeof node === 'object') {
    Object.entries(node).forEach(([key, value]) => {
      if (key === '$ref' && typeof value === 'string') refs.push(value);
      else collectRefs(value, refs);
    });
  }
  return refs;
};

describe('Swagger specification consistency', () => {
  let spec;
  let routeOps;
  let specOps;

  before(() => {
    spec = yaml.load(fs.readFileSync(SPEC_PATH, 'utf8'));

    routeOps = new Map();
    Object.entries(sails.config.routes).forEach(([address, target]) => {
      const [verb, routePath] = address.split(' ');
      if (!routePath || !routePath.startsWith(`${API_PREFIX}/`)) return;
      const action = typeof target === 'string' ? target : target.action;
      const key = `${verb.toLowerCase()} ${templateOf(
        routePath.slice(API_PREFIX.length)
      )}`;
      routeOps.set(key, {
        address,
        action,
        policies: [].concat(sails.config.policies[action]),
      });
    });

    specOps = new Map();
    Object.entries(spec.paths).forEach(([specPath, item]) => {
      METHODS.filter((m) => item[m]).forEach((method) => {
        specOps.set(`${method} ${templateOf(specPath)}`, {
          label: `${method.toUpperCase()} ${specPath}`,
          specPath,
          item,
          operation: item[method],
        });
      });
    });
  });

  it('documents every /api/v1 route', () => {
    const undocumented = [...routeOps.entries()]
      .filter(([key]) => !specOps.has(key))
      .map(([, route]) => route.address);
    should(undocumented).be.empty();
  });

  it('documents no operation that has no route', () => {
    const ghosts = [...specOps.entries()]
      .filter(([key]) => !routeOps.has(key))
      .map(([, op]) => op.label);
    should(ghosts).be.empty();
  });

  it('requires bearerAuth and documents a 401 on every authenticated operation', () => {
    const wrong = [];
    specOps.forEach(({ label, operation }, key) => {
      const route = routeOps.get(key);
      if (!route || !route.policies.some((p) => AUTH_POLICIES.includes(p))) {
        return;
      }
      const security = operation.security || spec.security || [];
      const required =
        security.length > 0 &&
        security.every((req) => Object.keys(req).includes('bearerAuth'));
      const has401 = Object.keys(operation.responses).includes('401');
      if (!required || !has401) wrong.push(label);
    });
    should(wrong).be.empty();
  });

  it('lets every public operation be called without a token', () => {
    const wrong = [];
    specOps.forEach(({ label, operation }, key) => {
      const route = routeOps.get(key);
      if (!route || route.policies.some((p) => AUTH_POLICIES.includes(p))) {
        return;
      }
      const security = operation.security || spec.security || [];
      const anonymousAllowed =
        security.length === 0 ||
        security.some((req) => Object.keys(req).length === 0);
      if (!anonymousAllowed) wrong.push(label);
    });
    should(wrong).be.empty();
  });

  it('declares exactly the path parameters of each path template', () => {
    const wrong = [];
    specOps.forEach(({ label, specPath, item, operation }) => {
      const expected = (specPath.match(/\{\w+\}/g) || [])
        .map((p) => p.slice(1, -1))
        .sort();
      const declared = [
        ...(item.parameters || []),
        ...(operation.parameters || []),
      ]
        .map((p) => (p.$ref ? resolvePointer(spec, p.$ref) : p))
        .filter((p) => p && p.in === 'path')
        .map((p) => p.name)
        .sort();
      if (expected.join() !== declared.join()) wrong.push(label);
    });
    should(wrong).be.empty();
  });

  it('resolves every internal $ref', () => {
    const unresolved = collectRefs(spec).filter(
      (ref) => ref.startsWith('#/') && resolvePointer(spec, ref) === undefined
    );
    should(unresolved).be.empty();
  });
});
