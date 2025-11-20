# arkivjs

A TypeScript client library for GolemDB/Arkiv blockchain interactions.

## Installation

```bash
npm install @arkiv-network/sdk
# or
bun add @arkiv-network/sdk
# or
yarn add @arkiv-network/sdk
```

## Usage

### Public Client with Query

```typescript
import { createPublicClient, http } from '@arkiv-network/sdk';
import { kaolin } from '@arkiv-network/sdk/chains';
import { eq } from '@arkiv-network/sdk/query';

// Create a public client
const client = createPublicClient({
  chain: kaolin,
  transport: http(),
});

// Get chain ID
const chainId = await client.getChainId();

// Get entity by key
const entity = await client.getEntity('0x123...');

// Build and execute a query using QueryBuilder
const query = client.buildQuery();
const result = await query
  .where(eq('testKey', 'testValue'))
  .ownedBy('0x1234567890123456789012345678901234567890')
  .withAttributes(true)
  .withPayload(true)
  .limit(10)
  .fetch();

console.log('Found entities:', result.entities);

// Pagination - fetch next page
if (result.hasNext()) {
  await result.next();
  console.log('Next page:', result.entities);
}

// Or use raw query string
const rawQueryResult = await client.query('testKey = testValue && $owner = 0x123...');
```

### Wallet Client with Create Entity

```typescript
import { createWalletClient, http, toBytes } from '@arkiv-network/sdk';
import { kaolin } from '@arkiv-network/sdk/chains';
import { privateKeyToAccount } from '@arkiv-network/sdk/accounts';
import { ExpirationTime, jsonToPayload } from '@arkiv-network/sdk/utils';

// Create a wallet client with an account
const client = createWalletClient({
  chain: kaolin,
  transport: http(),
  account: privateKeyToAccount('0x...'), // Your private key
});

// Create an entity
const { entityKey, txHash } = await client.createEntity({
  payload: toBytes(JSON.stringify({
    entity: {
      entityType: 'document',
      entityId: 'doc-123',
    },
  })),
  contentType: 'application/json',
  attributes: [
    { key: 'category', value: 'documentation' },
    { key: 'version', value: '1.0' },
  ],
  expiresIn: ExpirationTime.fromDays(30), // Entity expires in 30 days
});

console.log('Created entity:', entityKey);
console.log('Transaction hash:', txHash);

// Get the created entity
const entity = await client.getEntity(entityKey);
console.log('Entity:', entity);
```

## Package Distribution

This package supports multiple module formats for maximum compatibility:

- **CommonJS** (`dist/_cjs/`) - For Node.js `require()`
- **ES Modules** (`dist/_esm/`) - For modern `import` statements
- **TypeScript Source** (`src/`) - For Bun/Deno TypeScript-native runtimes
- **Type Declarations** (`dist/_types/`) - Full TypeScript support

### Runtime Support

**Bun/Deno (TypeScript native):**
- Runs TypeScript directly from source - no transpilation needed

**Node.js (ESM):**
```javascript
import { createPublicClient } from '@arkiv-network/sdk';  // Uses compiled ESM
```

**Node.js (CommonJS):**
```javascript
const { createPublicClient } = require('@arkiv-network/sdk');  // Uses compiled CJS
```

All formats provide full type safety and IntelliSense support when using TypeScript.

## Development

To install dependencies:

```bash
bun install
```

To build type declarations:

```bash
bun run build
```

To run type checking:

```bash
bun run type-check
```

To lint:

```bash
bun run lint
```
