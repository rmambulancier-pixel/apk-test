/* MesHeures V16.2 — correctif quatorzaines
   Règle UI : une période de paie couvre au minimum 2 quatorzaines,
   avec possibilité d'en couvrir 3. Le moteur calcPer(start, nb) reste
   la source de calcul des heures. */
(function () {
  'use strict';

  function clampNb() {
    if (!window.DB || !DB.per) return 2;
    let n = Number(DB.per.nb);
    if (!Number.isFinite(n)) n = 2;
    n = Math.max(2, Math.min(3, Math.round(n)));
    DB.per.nb = n;
    return n;
  }

  function syncPeriodUI() {
    if (!window.DB || !DB.per) return;
    const n = clampNb();
    const input = document.getElementById('pN');
    if (input) {
      input.min = '2';
      input.max = '3';
      input.step = '1';
      input.value = String(n);
      input.title = 'Une période de paie couvre 2 ou 3 quatorzaines.';
    }

    const start = DB.per.start;
    const label = document.getElementById('pLbl');
    if (start && label && typeof addD === 'function' && typeof short === 'function') {
      label.textContent = short(start) + ' → ' + short(addD(start, n * 14 - 1));
    }
  }

  function persistAndRender() {
    clampNb();
    if (typeof save === 'function') save();
    if (typeof renderPay === 'function') renderPay();
    setTimeout(syncPeriodUI, 0);
  }

  window.mhSetQuatorzaines = function (value) {
    let n = Number(value);
    if (!Number.isFinite(n)) n = 2;
    n = Math.max(2, Math.min(3, Math.round(n)));
    DB.per.nb = n;
    persistAndRender();
  };

  window.addEventListener('load', function () {
    syncPeriodUI();

    const input = document.getElementById('pN');
    if (input && !input.dataset.mhQBound) {
      input.dataset.mhQBound = '1';
      input.addEventListener('change', function () {
        mhSetQuatorzaines(this.value);
      });
    }
  });

  // Petit filet de sécurité : après chaque rendu de paie, le libellé est
  // recalé sur le nombre réellement sélectionné.
  const timer = setInterval(function () {
    if (document.getElementById('pN')) syncPeriodUI();
  }, 1000);

  window.addEventListener('beforeunload', function () {
    clearInterval(timer);
  });
})();
