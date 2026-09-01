document.addEventListener('DOMContentLoaded', function() {
  var primaryButton = document.createElement('button');
  primaryButton.type = 'button';
  primaryButton.className = 'sidebar-toggle-btn sidebar-toggle-btn--primary';
  primaryButton.setAttribute('aria-expanded', 'true');
  primaryButton.setAttribute('aria-label', 'Fechar a navegação principal');
  primaryButton.textContent = '☰';

  var secondaryButton = document.createElement('button');
  secondaryButton.type = 'button';
  secondaryButton.className = 'sidebar-toggle-btn sidebar-toggle-btn--secondary';
  secondaryButton.setAttribute('aria-expanded', 'true');
  secondaryButton.setAttribute('aria-label', 'Fechar o índice de seção');
  secondaryButton.textContent = '☰';

  document.body.appendChild(primaryButton);
  document.body.appendChild(secondaryButton);

  function updatePrimary() {
    var collapsed = document.body.classList.contains('sidebar-collapsed-primary');
    primaryButton.setAttribute('aria-expanded', String(!collapsed));
    primaryButton.setAttribute('aria-label', collapsed ? 'Abrir a navegação principal' : 'Fechar a navegação principal');
    primaryButton.textContent = collapsed ? '☰' : '×';
  }

  function updateSecondary() {
    var collapsed = document.body.classList.contains('sidebar-collapsed-secondary');
    secondaryButton.setAttribute('aria-expanded', String(!collapsed));
    secondaryButton.setAttribute('aria-label', collapsed ? 'Abrir o índice de seção' : 'Fechar o índice de seção');
    secondaryButton.textContent = collapsed ? '☰' : '×';
  }

  primaryButton.addEventListener('click', function() {
    document.body.classList.toggle('sidebar-collapsed-primary');
    updatePrimary();
  });

  secondaryButton.addEventListener('click', function() {
    document.body.classList.toggle('sidebar-collapsed-secondary');
    updateSecondary();
  });

  updatePrimary();
  updateSecondary();
});