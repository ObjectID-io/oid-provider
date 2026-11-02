import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Transaction } from '@iota/iota-sdk/transactions';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { sponsorshipMode, prepareSponsoredGas, submitSponsoredBytes, applySponsorGas } from '../src/sponsorship';
import { signAndExecute } from '../src/utils/tx';

const address = (n: string) => `0x${n.padStart(64, '0')}`;
const sponsor = address('55'), pkg = address('66');
const payment = [{ objectId: address('77'), version: '1', digest: '11111111111111111111111111111111' }];
const gs = { gasStation1URL: 'https://gs1.invalid', gasStation1Token: 'fixture', gasStation2URL: 'https://gs2.invalid', gasStation2Token: 'fixture' };
let config: any;
let calls: string[];
const original = globalThis.fetch;
afterEach(() => { globalThis.fetch = original; });
function setup(mode: string = 'gas-station') {
  config = { network: 'testnet', useGasStation: true, gasStation: gs, sponsorship: { mode, aa: { sponsorAccountId: sponsor, packageId: pkg } } };
  calls = [];
  globalThis.fetch = async (input: any, init: any) => {
    const url = String(input); calls.push(url);
    if (url.includes('iota.cafe')) {
      const request = JSON.parse(init.body);
      assert.equal(request.method, 'iota_getObject');
      return Response.json({ jsonrpc: '2.0', id: request.id, result: { data: { content: { fields: { json: Array.from(new TextEncoder().encode(JSON.stringify(config))) } } } } });
    }
    if (url.endsWith('/v1/reserve_gas')) return Response.json({ result: { sponsor_address: sponsor, reservation_id: 1, gas_coins: payment } });
    throw new Error('submit response lost');
  };
}
function client(overrides: any = {}) {
  return {
    getReferenceGasPrice: async () => 1000n,
    getLatestIotaSystemState: async () => ({ epoch: '10' }),
    getCoins: async () => ({ data: [{ coinObjectId: payment[0].objectId, version: '1', digest: payment[0].digest, balance: '1000000000' }], hasNextPage: false }),
    getObject: async () => ({ data: { objectId: sponsor, version: '1', digest: payment[0].digest, owner: { Shared: { initial_shared_version: '1' } }, content: { dataType: 'moveObject', type: `${pkg}::sponsor::Sponsor`, fields: { enabled: true, end_epoch: '100', max_gas_budget: '50000000', max_gas_price: '1000' } } } }),
    executeTransactionBlock: async () => ({}),
    waitForTransaction: async ({ digest }: any) => ({ digest, effects: { status: { status: 'success' } } }),
    ...overrides,
  } as any;
}
async function signed(c: any, gas: any) {
  const key = new Ed25519Keypair();
  const tx = new Transaction();
  // Offline fixture only; Move policy has independent tests for GasCoin rejection.
  tx.transferObjects([tx.gas], key.toIotaAddress());
  applySponsorGas(tx, gas, key.toIotaAddress());
  const bytes = await tx.build({ client: c });
  return { bytes, signature: (await key.signTransaction(bytes)).signature };
}

test('strict selector preserves legacy and rejects malformed explicit configuration', () => {
  assert.equal(sponsorshipMode({ useGasStation: true }), 'gas-station');
  assert.equal(sponsorshipMode({ useGasStation: false }), 'direct');
  assert.equal(sponsorshipMode({ sponsorship: { mode: 'aa-onchain' } }), 'aa-onchain');
  for (const sponsorship of [null, {}, { mode: 'typo' }]) assert.throws(() => sponsorshipMode({ sponsorship }));
});
test('public selector refreshes between operations without rebuilding session', async () => {
  setup(); const c = client();
  const gsGas = await prepareSponsoredGas(c, 'testnet', 1000000); assert.equal(gsGas.mode, 'gas-station'); gsGas.release();
  config.sponsorship.mode = 'aa-onchain';
  const aaGas = await prepareSponsoredGas(c, 'testnet', 1000000); assert.equal(aaGas.mode, 'aa-onchain'); aaGas.release();
});
test('GS fallback is allowed only during reservation', async () => {
  setup(); const fetch = globalThis.fetch;
  globalThis.fetch = async (input: any, init: any) => String(input).startsWith(gs.gasStation1URL) ? new Response('unavailable', { status: 503 }) : fetch(input, init);
  const gas = await prepareSponsoredGas(client(), 'testnet', 1000000);
  assert.equal(gas.stationUrl, gs.gasStation2URL); gas.release();
});
test('lost GS execute response preserves digest and never submits through second station', async () => {
  setup(); const c = client(); const gas = await prepareSponsoredGas(c, 'testnet', 1000000); const s = await signed(c, gas);
  await assert.rejects(submitSponsoredBytes(c, gas, s.bytes, [s.signature]), (e: any) => !!e.digest);
  assert.equal(calls.filter(u => u.endsWith('/v1/execute_tx')).length, 1);
  assert.equal(calls.some(u => u.startsWith(gs.gasStation2URL)), false);
});
test('AA uses unchanged signed bytes and two authentications', async () => {
  setup('aa-onchain'); let submitted: any;
  const c = client({ executeTransactionBlock: async (input: any) => { submitted = input; } });
  const gas = await prepareSponsoredGas(c, 'testnet', 1000000); const s = await signed(c, gas);
  await submitSponsoredBytes(c, gas, s.bytes, [s.signature]);
  assert.deepEqual(submitted.transactionBlock, s.bytes);
  assert.equal(submitted.signature.length, 2); assert.equal(submitted.signature[0], s.signature);
  assert.equal(calls.some(u => u.includes('gs1.invalid')), false);
});
test('AA detects signed gas mutation before submission', async () => {
  setup('aa-onchain'); let submitted = false;
  const c = client({ executeTransactionBlock: async () => { submitted = true; } });
  const gas = await prepareSponsoredGas(c, 'testnet', 1000000); const s = await signed(c, gas);
  const tx = Transaction.from(s.bytes); tx.setGasBudget(2000000);
  await assert.rejects(submitSponsoredBytes(c, gas, await tx.build({ client: c }), [s.signature]), /differs/);
  assert.equal(submitted, false);
});
test('disabled AA policy fails and releases allocation', async () => {
  setup('aa-onchain'); const c = client(); const good = c.getObject;
  c.getObject = async () => { const r = await good(); r.data.content.fields.enabled = false; return r; };
  await assert.rejects(prepareSponsoredGas(c, 'testnet', 1000000), /disabled/);
  c.getObject = good; const gas = await prepareSponsoredGas(c, 'testnet', 1000000); gas.release();
});
test('empty AA gas pool does not use GS or user funds', async () => {
  setup('aa-onchain');
  await assert.rejects(prepareSponsoredGas(client({ getCoins: async () => ({ data: [], hasNextPage: false }) }), 'testnet', 1000000), /funded/);
  assert.equal(calls.some(u => u.includes('gs1.invalid')), false);
});
test('configuration network mismatch fails before allocation', async () => {
  setup(); config.network = 'mainnet';
  await assert.rejects(prepareSponsoredGas(client(), 'testnet', 1000000), /network mismatch/);
});
test('failed Move execution is not reported as success', async () => {
  setup('aa-onchain'); const c = client({ waitForTransaction: async ({ digest }: any) => ({ digest, effects: { status: { status: 'failure', error: 'MoveAbort' } } }) });
  const gas = await prepareSponsoredGas(c, 'testnet', 1000000); const s = await signed(c, gas);
  await assert.rejects(submitSponsoredBytes(c, gas, s.bytes, [s.signature]), /MoveAbort/);
});
test('executor reports configuration failure exactly once without user-paid fallback', async () => {
  setup('invalid'); let notifications = 0;
  const c = client({ signAndExecuteTransaction: () => { throw Error('must not pay user gas'); } });
  const r = await signAndExecute(c, new Ed25519Keypair(), new Transaction(), { network: 'testnet', gasBudget: 1000000, onExecuted: () => { notifications++; } });
  assert.equal(r.success, false); assert.equal(notifications, 1);
});
