const test = require('node:test');
const assert = require('node:assert/strict');
const CustodyChain = require('../src/custody-chain.js');

test('sha256Hex matches the known test vector for "hello"', async () => {
  const hash = await CustodyChain.sha256Hex('hello');
  assert.equal(hash, '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
});

test('an unedited chain verifies fully true', async () => {
  const entries = [
    { role: 'Question Setter', note: 'a', time: 1000 },
    { role: 'Print Vendor', note: 'b', time: 2000 },
    { role: 'Transport Custodian', note: 'c', time: 3000 },
  ];
  const { genesisHash, blocks } = await CustodyChain.buildChain(entries, 'test-seed');
  const notes = entries.map((e) => e.note);
  const results = await CustodyChain.verifyChain(genesisHash, blocks, notes);
  assert.deepEqual(results.map((r) => r.ok), [true, true, true]);
  // recomputed hash should equal the sealed hash for every verified block
  results.forEach((r, i) => assert.equal(r.recomputedHash, blocks[i].sealedHash));
});

test('editing one note invalidates that block and every block after it', async () => {
  const entries = [
    { role: 'Question Setter', note: 'a', time: 1000 },
    { role: 'Print Vendor', note: 'b', time: 2000 },
    { role: 'Transport Custodian', note: 'c', time: 3000 },
    { role: 'District Coordinator', note: 'd', time: 4000 },
  ];
  const { genesisHash, blocks } = await CustodyChain.buildChain(entries, 'test-seed');
  const tampered = entries.map((e) => e.note);
  tampered[1] = 'TAMPERED NOTE';
  const results = await CustodyChain.verifyChain(genesisHash, blocks, tampered);
  assert.deepEqual(results.map((r) => r.ok), [true, false, false, false]);
  // the mismatched block's recomputed hash should differ from what was sealed
  assert.notEqual(results[1].recomputedHash, blocks[1].sealedHash);
});

test('editing the last entry only invalidates that one entry', async () => {
  const entries = [
    { role: 'A', note: 'a', time: 1 },
    { role: 'B', note: 'b', time: 2 },
    { role: 'C', note: 'c', time: 3 },
  ];
  const { genesisHash, blocks } = await CustodyChain.buildChain(entries, 'seed');
  const notes = entries.map((e) => e.note);
  notes[2] = 'edited';
  const results = await CustodyChain.verifyChain(genesisHash, blocks, notes);
  assert.deepEqual(results.map((r) => r.ok), [true, true, false]);
});

test('two different genesis seeds produce different chains for identical entries', async () => {
  const entries = [{ role: 'X', note: 'y', time: 1 }];
  const a = await CustodyChain.buildChain(entries, 'seed-one');
  const b = await CustodyChain.buildChain(entries, 'seed-two');
  assert.notEqual(a.blocks[0].sealedHash, b.blocks[0].sealedHash);
});

test('sealed hash is a 64-character lowercase hex string', async () => {
  const entries = [{ role: 'X', note: 'y', time: 1 }];
  const { blocks } = await CustodyChain.buildChain(entries, 'seed');
  assert.match(blocks[0].sealedHash, /^[0-9a-f]{64}$/);
});
