import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  MIN_CANCELLATION_REASON_LENGTH,
  canCancelReservation,
  cancelByProducer,
  isValidCancellationReason,
  normalizeCancellationReason
} from '../src/flow-model.js';

const accepted = { id: 'CAF-1', st: 'accepted', cid: 'c1', oid: 'o1' };
const pending = { id: 'CAF-2', st: 'pending', cid: 'c1', oid: 'o1' };

assert.equal(isValidCancellationReason(''), false, 'empty justification is invalid');
assert.equal(isValidCancellationReason('   '), false, 'whitespace is invalid');
assert.equal(isValidCancellationReason('curto'), false, 'short justification is invalid');
assert.equal(isValidCancellationReason('Motivo válido'), true);
assert.equal(normalizeCancellationReason('  Motivo válido  '), 'Motivo válido');
assert.equal(canCancelReservation(accepted, 'producer'), true);
assert.equal(canCancelReservation(pending, 'consumer'), true, 'consumer can cancel a pending request');
assert.equal(canCancelReservation(pending, 'producer'), false, 'producer cannot cancel a pending request');
assert.equal(canCancelReservation({ ...accepted, st: 'cancelled', cancelOrigin: 'producer' }, 'producer'), false);
assert.equal(canCancelReservation({ ...accepted, st: 'cancelled', cancelOrigin: 'producer' }, 'consumer'), false);

const unchanged = cancelByProducer(accepted, '   curto  ');
assert.deepEqual(unchanged, accepted, 'invalid cancellation must not mutate reservation');
const cancelled = cancelByProducer(accepted, '  Surgiu um imprevisto no sítio.  ');
assert.equal(cancelled.st, 'cancelled');
assert.equal(cancelled.cancelOrigin, 'producer');
assert.equal(cancelled.cancellationJustification, 'Surgiu um imprevisto no sítio.');
assert.equal(cancelled.pm, cancelled.cancellationJustification);
assert.match(cancelled.consumerMessage, /Surgiu um imprevisto no sítio/);
assert.equal(cancelByProducer(cancelled, 'Outro motivo'), cancelled, 'producer cannot cancel twice');

const entrypoint = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8');
assert.match(entrypoint, /Justificativa do cancelamento/);
assert.match(entrypoint, /CANCELADO PELO PRODUTOR/);
assert.match(entrypoint, /cancellationJustification/);
assert.match(entrypoint, /role="alert"/);
assert.match(entrypoint, /setCancellationDraft/);
assert.match(entrypoint, /canCancelReservation\(r,'consumer'\)/);
assert.match(entrypoint, /O consumidor foi notificado/);
assert.match(entrypoint, /Cancelar por imprevisto/);
assert.match(entrypoint, /nav\(`\/painel\/notificacoes\/\$\{id\}\/cancelar`\)/);
assert.match(entrypoint, /path="\/painel\/notificacoes\/:id\/cancelar"/);
assert.match(entrypoint, /<ProducerReservation cancel\/>/);
assert.match(entrypoint, /cancel&&!canCancelReservation\(r,'producer'\)/);
assert.match(entrypoint, /path="\/painel\/notificacoes\/resposta-enviada"/);

console.log(`cancellation: ${MIN_CANCELLATION_REASON_LENGTH} char minimum and propagation assertions passed`);
