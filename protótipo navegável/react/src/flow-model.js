export const roles = ['consumer', 'producer', 'admin'];

export const permissions = {
  consumidor: ['reserve', 'requests', 'account', 'explore', 'search', 'product', 'experience', 'notifications'],
  produtor: ['producer', 'add', 'account', 'notifications'],
  consumer: ['explore', 'product', 'experience', 'reserve', 'requests', 'account', 'notifications'],
  producer: ['producer', 'add', 'account', 'notifications'],
  admin: ['admin', 'users']
};

export const canAccess = (role, area) => Boolean(role && permissions[role]?.includes(area));

export const transitionReservation = (current, event) => {
  const transitions = {
    pending: { cancel: 'cancelled', cancelByConsumer: 'cancelled', accept: 'accepted', reject: 'refused', refused: 'refused' },
    cancelled: {}, accepted: { cancel: 'cancelled', cancelByProducer: 'cancelled', cancelByConsumer: 'cancelled' }, refused: {}
  };
  const next = transitions[current]?.[event] || current;
  return next === 'refused' && event === 'reject' ? 'rejected' : next;
};

export const MIN_CANCELLATION_REASON_LENGTH = 10;

export const normalizeCancellationReason = value => String(value ?? '').trim();

export const isValidCancellationReason = value =>
  normalizeCancellationReason(value).length >= MIN_CANCELLATION_REASON_LENGTH;

export const canCancelReservation = (reservation, actor) => {
  if (!reservation || !['pending', 'accepted'].includes(reservation.st)) return false;
  if (actor === 'producer') return reservation.st === 'accepted' && reservation.cancelOrigin !== 'producer';
  if (actor === 'consumer') return reservation.cancelOrigin !== 'producer';
  return false;
};

export const cancelByProducer = (reservation, reason) => {
  const justification = normalizeCancellationReason(reason);
  if (!canCancelReservation(reservation, 'producer') || !isValidCancellationReason(justification)) {
    return reservation;
  }
  return {
    ...reservation,
    st: 'cancelled',
    cancelOrigin: 'producer',
    cancellationJustification: justification,
    pm: justification,
    consumerMessage: `O produtor cancelou esta pré-reserva. Motivo: ${justification}`
  };
};

export const formatDate = value => value ? value.split('-').reverse().join('/') : '';
export const formatTime = value => value?.replace(':', 'h') || '';
