const screens = [...document.querySelectorAll('[data-screen]')];
const toast = document.querySelector('#toast');
const state = { filter: 'all', paid: false };

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 3600);
}

function navigate(route) {
  const target = document.querySelector(`[data-screen="${route}"]`);
  if (!target) return;
  screens.forEach((screen) => screen.classList.toggle('screen--active', screen === target));
  window.location.hash = route;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (route === 'explore') window.setTimeout(initMap, 0);
}

function filterOffers(type) {
  state.filter = type;
  document.querySelectorAll('.chip[data-filter]').forEach((chip) => chip.classList.toggle('chip--active', chip.dataset.filter === type));
  let visible = 0;
  document.querySelectorAll('.offer-card').forEach((card) => {
    const match = type === 'all' || card.dataset.type === type;
    card.hidden = !match;
    if (match) visible += 1;
  });
  const count = document.querySelector('#result-count');
  if (count) count.textContent = visible;
}

let map;
function initMap() {
  if (map || !window.L || !document.querySelector('#map')) return;
  try {
    map = L.map('map', { zoomControl: false, scrollWheelZoom: false }).setView([-15.57, -48.11], 11);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 17 }).addTo(map);
    const offers = [
      { point: [-15.53, -48.18], label: 'Feira da Dona Lúcia', type: 'Produto' },
      { point: [-15.58, -48.05], label: 'Trilha das Nascentes', type: 'Experiência' },
      { point: [-15.62, -48.15], label: 'Casa do Cerrado', type: 'Hospedagem' },
      { point: [-15.48, -48.02], label: 'Oficina de Agrofloresta', type: 'Workshop' },
    ];
    offers.forEach((offer) => L.marker(offer.point).addTo(map).bindPopup(`<strong>${offer.label}</strong><br>${offer.type}<br><small>Localização aproximada</small>`));
  } catch (error) {
    document.querySelector('#map-fallback')?.classList.add('is-visible');
  }
}

function handleAction(action, element) {
  if (action === 'use-location') {
    const feedback = document.querySelector('#location-feedback');
    if (!navigator.geolocation) {
      feedback.textContent = 'Seu navegador não disponibilizou localização. Exibindo a área aproximada da Cafuringa.';
      return;
    }
    navigator.geolocation.getCurrentPosition(() => { feedback.textContent = 'Região identificada. O mapa continua exibindo apenas áreas aproximadas.'; }, () => { feedback.textContent = 'Não foi possível acessar sua localização. Você continua vendo a área aproximada.'; });
  }
  if (action === 'search') showToast('Busca atualizada. Os resultados continuam sem priorização paga.');
  if (action === 'clear-filter') filterOffers('all');
  if (action === 'toggle-map') { document.querySelector('#map')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); showToast('Mapa aproximado ativado.'); }
  if (action === 'retry-map') { document.querySelector('#map-fallback')?.classList.remove('is-visible'); initMap(); }
  if (action === 'contact') showToast('Contato preparado. O produtor decide quando compartilhar os dados permitidos.');
  if (action === 'copy-pix') { navigator.clipboard?.writeText('cafuringa.demo/pix/7A2'); showToast('Código Pix demonstrativo copiado.'); }
  if (action === 'simulate-payment') {
    state.paid = true;
    const button = document.querySelector('#pay-button');
    const status = document.querySelector('#reservation-status');
    const feedback = document.querySelector('#payment-feedback');
    button.textContent = 'Sinal simulado como pago';
    button.disabled = true;
    status.textContent = 'Aguardando anfitrião';
    status.className = 'status status--success';
    document.querySelector('#step-payment')?.classList.remove('step--active');
    document.querySelector('#step-payment')?.classList.add('step--done');
    document.querySelector('#step-owner')?.classList.add('step--active');
    feedback.textContent = 'Pagamento registrado na demonstração. Agora o anfitrião precisa responder à solicitação.';
    const accountState = document.querySelector('#account-reservation-state');
    if (accountState) accountState.textContent = 'Aguardando resposta do anfitrião';
  }
  if (action === 'open-feedback') document.querySelector('#feedback-panel')?.removeAttribute('hidden');
  if (action === 'send-feedback') { document.querySelector('#feedback-result').textContent = 'Feedback privado enviado ao proprietário. Obrigado por cuidar da rede.'; showToast('Feedback enviado.'); }
  if (action === 'open-assistant') document.querySelector('#assistant-drawer')?.removeAttribute('hidden');
  if (action === 'close-assistant') document.querySelector('#assistant-drawer')?.setAttribute('hidden', '');
  if (action === 'send-chat') showToast('O assistente respondeu usando apenas informações disponíveis na demonstração.');
  if (action === 'accept-request') showToast('Resposta simulada enviada. O visitante será notificado.');
  if (action === 'save-offer') { document.querySelector('#offer-feedback').textContent = 'Rascunho salvo localmente. Nada foi publicado automaticamente.'; showToast('Rascunho salvo.'); }
  if (action === 'use-suggestion') { const field = document.querySelector('#offer-description'); field.value = 'Uma oficina prática para conhecer técnicas de cuidado com nascentes e plantio agroflorestal, conduzida por quem vive este território.'; field.focus(); showToast('Sugestão inserida no formulário.'); }
  if (action === 'export-admin') showToast('Resumo de administração simulado.');
  if (action === 'producer-offers') showToast('Nesta demonstração, a vitrine está resumida no painel.');
  if (action === 'producer-requests') showToast('Solicitações abertas: 3.');
  if (action === 'admin-offers') showToast('A gestão avançada de ofertas está planejada para a próxima etapa.');
}

document.addEventListener('click', (event) => {
  const routeTarget = event.target.closest('[data-route]');
  if (routeTarget) { event.preventDefault(); navigate(routeTarget.dataset.route); if (routeTarget.dataset.filter) filterOffers(routeTarget.dataset.filter); return; }
  const filterTarget = event.target.closest('[data-filter]');
  if (filterTarget) { filterOffers(filterTarget.dataset.filter); return; }
  const actionTarget = event.target.closest('[data-action]');
  if (actionTarget) handleAction(actionTarget.dataset.action, actionTarget);
});

window.addEventListener('hashchange', () => navigate(window.location.hash.slice(1) || 'landing'));
window.addEventListener('load', () => {
  const queryRoute = new URLSearchParams(window.location.search).get('screen');
  navigate(queryRoute || window.location.hash.slice(1) || 'landing');
});
