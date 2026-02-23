# Testing

[Back to README](./README.md) | [Hooks](./hooks.md) | [API Layer](./api-layer.md) | [Getting Started](./getting-started.md)

The Sigloop webapp uses Jest with React Testing Library to test custom hooks. Tests verify that hooks correctly interact with the API layer and manage React Query state.

**Test directory:** `src/hooks/__tests__/`

---

## Table of Contents

- [Jest Configuration](#jest-configuration)
- [Running Tests](#running-tests)
- [Test Files](#test-files)
- [Mocking Strategy](#mocking-strategy)
- [Test Wrapper Pattern](#test-wrapper-pattern)
- [What Is Tested](#what-is-tested)

---

## Jest Configuration

**Source:** `jest.config.ts`

```ts
export default {
  testEnvironment: "jsdom",
  transform: { "^.+\\.tsx?$": "ts-jest" },
  moduleNameMapper: {
    "\\.(css|less)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterSetup: ["@testing-library/jest-dom"],
};
```

| Setting | Value | Purpose |
|---------|-------|---------|
| `testEnvironment` | `"jsdom"` | Simulates a browser DOM environment |
| `transform` | `ts-jest` | Transpiles TypeScript files for Jest |
| `moduleNameMapper` (CSS) | `identity-obj-proxy` | Stubs CSS imports so they do not break tests |
| `moduleNameMapper` (`@/`) | `<rootDir>/src/$1` | Maps the `@/` path alias to the `src/` directory |
| `setupFilesAfterSetup` | `@testing-library/jest-dom` | Adds custom matchers like `toBeInTheDocument()` |

---

## Running Tests

```bash
# Run all tests
npx jest

# Run a specific test file
npx jest src/hooks/__tests__/useWallet.test.ts

# Run tests in watch mode
npx jest --watch

# Run with coverage
npx jest --coverage
```

---

## Test Files

| File | Tests |
|------|-------|
| `src/hooks/__tests__/useWallet.test.ts` | `useWallets` (data, loading, error), `useCreateWallet` (mutation) |
| `src/hooks/__tests__/useAgent.test.ts` | `useAgents` (data), `useRevokeAgent` (mutation) |
| `src/hooks/__tests__/usePolicy.test.ts` | `usePolicies` (data), `useCreatePolicy` (mutation) |
| `src/hooks/__tests__/useX402.test.ts` | `usePayments` (data), `usePaymentStats` (data) |
| `src/hooks/__tests__/useDefi.test.ts` | `useSwap` (mutation), `useLend` (mutation) |

---

## Mocking Strategy

All tests mock the API layer modules using `jest.mock()`. This isolates hook logic from network calls.

### API Module Mocking

Each test file mocks its corresponding API module:

```ts
// useWallet.test.ts
import * as walletApi from "../../api/wallets";
jest.mock("../../api/wallets");
const mockedApi = walletApi as jest.Mocked<typeof walletApi>;
```

```ts
// useDefi.test.ts (mocks the generic client instead)
import * as clientModule from "../../api/client";
jest.mock("../../api/client");
const mockedClient = clientModule as jest.Mocked<typeof clientModule>;
```

### Mock Return Values

Tests set up mock return values before rendering hooks:

```ts
// Successful response
mockedApi.fetchWallets.mockResolvedValue([{ id: "1", name: "Test", ... }]);

// Error response
mockedApi.fetchWallets.mockRejectedValue(new Error("Network error"));

// Never-resolving promise (for loading state)
mockedApi.fetchWallets.mockReturnValue(new Promise(() => {}));
```

---

## Test Wrapper Pattern

All hook tests use a `createWrapper()` factory that provides a fresh `QueryClient` with `retry: false` (to avoid test timeouts on failures):

```ts
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}
```

Hooks are rendered using `renderHook` from `@testing-library/react`:

```ts
const { result } = renderHook(() => useWallets(), {
  wrapper: createWrapper(),
});
```

---

## What Is Tested

### useWallet.test.ts

| Test | Description |
|------|-------------|
| `useWallets` returns wallets from API | Verifies that `data` matches the mocked response after `isSuccess` is true |
| `useWallets` handles loading state | Verifies `isLoading` is `true` while the promise is pending |
| `useWallets` handles error state | Verifies `isError` is `true` when the API rejects |
| `useCreateWallet` calls createWallet API | Verifies `mutate()` calls `createWallet` with the correct `CreateWalletRequest` payload |

### useAgent.test.ts

| Test | Description |
|------|-------------|
| `useAgents` returns agents from API | Verifies agent data is returned correctly |
| `useRevokeAgent` calls revokeAgent API | Verifies `mutate("a1")` calls `revokeAgent` with `"a1"` |

### usePolicy.test.ts

| Test | Description |
|------|-------------|
| `usePolicies` returns policies from API | Verifies policy data including nested `spending`, `allowlist`, and `timeWindow` |
| `useCreatePolicy` calls createPolicy API | Verifies the full `CreatePolicyRequest` payload is passed correctly |

### useX402.test.ts

| Test | Description |
|------|-------------|
| `usePayments` returns payment history | Verifies payment records are returned |
| `usePaymentStats` returns payment stats | Verifies aggregated stats including `topDomains` |

### useDefi.test.ts

| Test | Description |
|------|-------------|
| `useSwap` calls swap endpoint | Verifies `apiClient` is called with `"/defi/swap"`, `POST` method, and correct JSON body |
| `useLend` calls lend endpoint | Verifies `apiClient` is called with the lending payload |

---

## Assertions Pattern

Tests consistently use `waitFor` to handle async state updates:

```ts
// Wait for success state
await waitFor(() => expect(result.current.isSuccess).toBe(true));

// Then assert on data
expect(result.current.data).toEqual(expectedData);

// Or verify API was called correctly
expect(mockedApi.createWallet).toHaveBeenCalledWith({
  name: "New Wallet",
  chainId: 1,
});
```
