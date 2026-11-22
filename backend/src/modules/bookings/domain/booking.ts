/**
 * Regras da pré-reserva de experiência (HU44/RF44, RN19).
 *
 * Os valores são os mesmos que o app envia e espera (`app/src/features/bookings`).
 */

/** Ciclo de vida da solicitação (RN21). Só a HU44 cria; as demais HUs mudam. */
export enum BookingStatus {
  PENDENTE = 'pendente',
  ACEITA = 'aceita',
  RECUSADA = 'recusada',
  CANCELADA = 'cancelada',
}

/** RN19: toda solicitação nasce pendente e não confirma a experiência sozinha. */
export const INITIAL_BOOKING_STATUS = BookingStatus.PENDENTE;

/** Forma de pagamento combinada com o produtor; a plataforma não cobra (OE3). */
export enum PaymentMethod {
  PIX = 'pix',
  DINHEIRO = 'dinheiro',
  CARTAO_CREDITO = 'cartao_credito',
  CARTAO_DEBITO = 'cartao_debito',
}

export const PARTICIPANTES_MIN = 1;
export const PARTICIPANTES_MAX = 50;
export const MENSAGEM_MAX = 500;

/** Horários de hora em hora, cobrindo o dia todo: 00:00 a 23:00. */
export const BOOKING_HOURS: readonly string[] = Array.from(
  { length: 24 },
  (_, hour) => `${String(hour).padStart(2, '0')}:00`,
);

/** As experiências acontecem na APA de Cafuringa (DF). */
export const BOOKING_TIME_ZONE = 'America/Sao_Paulo';

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `YYYY-MM-DD` de um dia que existe no calendário (sem 30/02). */
export function isValidBookingDate(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const LOCAL_CLOCK = new Intl.DateTimeFormat('en-CA', {
  timeZone: BOOKING_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** "YYYY-MM-DDTHH:MM" do instante no horário de Brasília. */
function localDateTime(now: Date): string {
  const part = Object.fromEntries(
    LOCAL_CLOCK.formatToParts(now).map((p) => [p.type, p.value]),
  );
  return `${part.year}-${part.month}-${part.day}T${part.hour}:${part.minute}`;
}

/**
 * Se o horário pedido já começou no horário de Brasília. Quem começa
 * exatamente agora também conta como passado, como no app. Espera data e
 * horário já validados (`YYYY-MM-DD` e `HH:MM`), que comparam como texto.
 */
export function isBookingInPast(
  data: string,
  horario: string,
  now: Date = new Date(),
): boolean {
  return `${data}T${horario}` <= localDateTime(now);
}
