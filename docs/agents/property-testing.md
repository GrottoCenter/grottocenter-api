# Property-Based Testing with fast-check

## When to use a property test

Property tests are for **pure functions and service-layer logic**, never HTTP endpoints.

- **`fc.property`** (sync) for pure functions: converters, validators, parsers, formatters, coercion.
- **`fc.asyncProperty`** sparingly, for service logic with stubbed dependencies (`sinon.stub(CommonService, 'query')`). Never let a property test reach a real database or HTTP server.
- **Never with `supertest`.** 100 iterations × N endpoints exhausts sockets and makes the suite flaky. Write conventional `it()` cases with representative inputs instead.
- **Never over a constant or boolean arbitrary.** If the input space is `true`/`false` or one fixture ID, write one `it()` per case.

Rule of thumb: if the test calls `supertest(sails.hooks.http.app)`, it is a conventional test.

## Designing arbitraries

- Match breadth to the trust boundary: narrow for system-controlled inputs, adversarial for user input. When unsure, start wide and narrow only once you have confirmed the validation exists.
- Layer user input from safe to hostile:

  ```js
  const userInputName = fc.frequency(
    { weight: 7, arbitrary: safeAlphanumericName }, // typical input
    { weight: 2, arbitrary: unicodeName }, // accents, CJK, emoji
    { weight: 1, arbitrary: hostileName } // control chars, null bytes, SQL fragments
  );
  ```

- Adversarial values: non-ASCII Unicode, whitespace variants, boundary lengths, `null` / missing, negatives, `NaN`, `Infinity`, empty and large arrays.
- Prefer `.map()` over `.chain()` for independent transformations (better shrinking).
- Generate leaf values in `fc.property` and assemble the scenario with plain functions outside the arbitrary.
- Use `fc.uniqueArray` with `selector` for key-based uniqueness.

Review checklist:

1. Which fields does the consumer ignore or strip?
2. Which mappings or translations does the code perform?
3. Which fields are optional? Generate both present and absent.
4. What are the array boundary cases?
5. What happens with duplicates?
6. Could a wrong implementation pass this arbitrary?

## Writing strong properties

- Be prescriptive: a property should rule out wrong implementations, not just describe output.
- Reconstruction (rebuild the input from the output) is the strongest property for parsers.
- Partition the input space and prescribe behavior per partition.
- Combine structural properties (shape) with semantic ones (round-trips).
- Ask: "can I imagine a wrong function that passes all of these?"
- Do not re-derive the expected value with the production logic.

Name a property by the invariant it encodes, not "should parse correctly", and document what it constrains and which input partition it covers. Do not reference task numbers.

## Mocha integration

```js
const should = require('should');
const fc = require('fast-check');

describe('MyService - Property: invariant name', () => {
  it('holds the invariant under random inputs', () => {
    fc.assert(
      fc.property(fc.integer(), fc.string(), (n, s) => {
        const result = MyService.doSomething(n, s);
        should(result).have.property('id');
        should(result.id).be.a.Number();
      }),
      { numRuns: 100 }
    );
  });
});
```

- Default to `{ numRuns: 100 }`; raise it for critical invariants.
- Give async properties a generous timeout (use `function` to reach `this.timeout()`).
- Restore Sinon stubs after each generated case.
- Files that contain only property tests use the `.property.test.js` suffix.
