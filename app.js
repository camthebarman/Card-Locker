/**
 * Card Locker — a digital portfolio of tradable cards.
 *
 * Plain HTML/CSS/JS, no build step and no dependencies. Cards you add are kept
 * in localStorage on the device; the 20 demo football cards come from cards.js.
 */
(function () {
  'use strict';

  var STORE_CARDS = 'cardlocker:cards:v1';
  var STORE_SORT = 'cardlocker:sort:v1';
  var MAX_IMAGE_PX = 900; // uploads are downscaled so localStorage stays workable

  var grid = document.getElementById('grid');
  var empty = document.getElementById('empty');
  var searchInput = document.getElementById('search');
  var sortSelect = document.getElementById('sort');
  var dialog = document.getElementById('add-dialog');
  var form = document.getElementById('add-form');
  var fileInput = document.getElementById('f-image');
  var preview = document.getElementById('upload-preview');
  var uploadText = document.getElementById('upload-text');
  var formError = document.getElementById('add-error');

  var money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  var moneyExact = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  var dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  var userCards = loadUserCards();
  var pendingImage = null; // data URL of the photo chosen in the add sheet

  /* ------------------------------------------------------------------ data */

  function loadUserCards() {
    try {
      var raw = localStorage.getItem(STORE_CARDS);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function saveUserCards() {
    localStorage.setItem(STORE_CARDS, JSON.stringify(userCards));
  }

  function allCards() {
    return (window.DEMO_CARDS || []).concat(userCards);
  }

  var PSA_LABELS = {
    10: 'Gem Mint', 9: 'Mint', 8: 'Near Mint-Mint', 7: 'Near Mint',
    6: 'Excellent-Mint', 5: 'Excellent', 4: 'Very Good-Excellent',
    3: 'Very Good', 2: 'Good', 1: 'Poor',
  };

  /* A search link is a sane fallback when a card has no listing of its own. */
  function buyUrl(card) {
    if (card.buyUrl) return card.buyUrl;
    var terms = [card.year, card.set, card.name, card.psa ? 'PSA ' + card.psa : ''].filter(Boolean).join(' ');
    return 'https://www.ebay.com/sch/i.html?_nkw=' + encodeURIComponent(terms);
  }

  function subtitle(card) {
    return [card.year, card.set, card.parallel].filter(Boolean).join(' · ');
  }

  /* --------------------------------------------------------------- sorting */

  var SORTERS = {
    'added-desc': function (a, b) { return time(b.addedAt) - time(a.addedAt) || byName(a, b); },
    'added-asc': function (a, b) { return time(a.addedAt) - time(b.addedAt) || byName(a, b); },
    'price-asc': function (a, b) { return num(a.price) - num(b.price) || byName(a, b); },
    'price-desc': function (a, b) { return num(b.price) - num(a.price) || byName(a, b); },
    'name-asc': byName,
    'name-desc': function (a, b) { return byName(b, a); },
  };

  function byName(a, b) {
    return String(a.name).localeCompare(String(b.name), 'en', { sensitivity: 'base' });
  }

  function time(value) {
    var t = new Date(value).getTime();
    return isNaN(t) ? 0 : t;
  }

  function num(value) {
    var n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }

  function visibleCards() {
    var query = searchInput.value.trim().toLowerCase();
    var list = allCards().filter(function (card) {
      if (!query) return true;
      return [card.name, card.team, card.set, card.parallel, card.position, card.year]
        .filter(Boolean).join(' ').toLowerCase().indexOf(query) !== -1;
    });
    return list.sort(SORTERS[sortSelect.value] || SORTERS['added-desc']);
  }

  /* -------------------------------------------------------------- rendering */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function cardNode(card) {
    var item = el('li', 'card');
    item.dataset.id = card.id;

    var inner = el('div', 'card__inner');

    /* Front: the photo, tap to flip. */
    var front = el('button', 'card__face card__face--front');
    front.type = 'button';
    front.setAttribute('aria-pressed', 'false');
    front.setAttribute('aria-label', 'Flip ' + card.name + ' to see price and grade');

    var img = el('img', 'card__img');
    img.src = card.image;
    img.alt = card.name + ' — ' + subtitle(card);
    img.loading = 'lazy';
    img.decoding = 'async';
    front.appendChild(img);

    var caption = el('div', 'card__caption');
    var captionText = el('div', 'card__caption__text');
    captionText.appendChild(el('span', 'card__name', card.name));
    captionText.appendChild(el('span', 'card__sub', subtitle(card) || 'Custom card'));
    caption.appendChild(captionText);
    caption.appendChild(el('span', 'card__grade' + (card.psa ? '' : ' card__grade--none'),
      card.psa ? 'PSA ' + card.psa : 'RAW'));
    front.appendChild(caption);

    /* Back: price, buy button, PSA rating underneath it. */
    var back = el('div', 'card__face card__face--back');
    back.appendChild(el('span', 'back__set', subtitle(card) || 'Custom card'));
    back.appendChild(el('h2', 'back__name', card.name));
    var meta = [card.position, card.team].filter(Boolean).join(' · ');
    if (meta) back.appendChild(el('span', 'back__meta', meta));

    var price = el('div', 'back__price', moneyExact.format(num(card.price)));
    price.appendChild(el('small', null, 'Market value'));
    back.appendChild(price);

    var buy = el('a', 'btn btn--buy', 'Buy now');
    buy.href = buyUrl(card);
    buy.target = '_blank';
    buy.rel = 'noopener noreferrer';
    back.appendChild(buy);

    back.appendChild(psaNode(card));

    var tools = el('div', 'back__tools');
    tools.appendChild(el('span', 'back__meta', 'Added ' + formatDate(card.addedAt)));
    if (card.custom) {
      var remove = el('button', 'linkish linkish--danger', 'Remove');
      remove.type = 'button';
      remove.dataset.action = 'remove';
      tools.appendChild(remove);
    } else {
      var flipBack = el('button', 'linkish', 'Flip back');
      flipBack.type = 'button';
      tools.appendChild(flipBack);
    }
    back.appendChild(tools);

    inner.appendChild(front);
    inner.appendChild(back);
    item.appendChild(inner);
    return item;
  }

  function psaNode(card) {
    var box = el('div', 'psa' + (card.psa ? '' : ' psa--none'));
    box.appendChild(el('span', 'psa__grade', card.psa ? String(card.psa) : '—'));

    var text = el('div', 'psa__text');
    text.appendChild(el('b', null, card.psa ? 'PSA ' + card.psa + ' ' + (PSA_LABELS[card.psa] || '') : 'Ungraded'));
    text.appendChild(document.createTextNode(card.cert ? 'Cert #' + card.cert : 'No cert on file'));
    box.appendChild(text);
    return box;
  }

  function formatDate(value) {
    var d = new Date(value);
    return isNaN(d.getTime()) ? 'unknown' : dateFmt.format(d);
  }

  function render() {
    var cards = visibleCards();
    var frag = document.createDocumentFragment();
    cards.forEach(function (card) { frag.appendChild(cardNode(card)); });
    grid.textContent = '';
    grid.appendChild(frag);
    empty.hidden = cards.length > 0;
    renderStats();
  }

  function renderStats() {
    var cards = allCards();
    var total = cards.reduce(function (sum, card) { return sum + num(card.price); }, 0);
    var graded = cards.filter(function (card) { return num(card.psa) > 0; });
    var avg = graded.length
      ? (graded.reduce(function (sum, card) { return sum + num(card.psa); }, 0) / graded.length).toFixed(1)
      : '—';

    document.getElementById('stat-count').textContent = String(cards.length);
    document.getElementById('stat-value').textContent = money.format(total);
    document.getElementById('stat-psa').textContent = avg;
  }

  /* ------------------------------------------------------------ interaction */

  function flip(item, flipped) {
    item.classList.toggle('is-flipped', flipped);
    var front = item.querySelector('.card__face--front');
    if (front) front.setAttribute('aria-pressed', flipped ? 'true' : 'false');
  }

  grid.addEventListener('click', function (event) {
    var item = event.target.closest('.card');
    if (!item) return;

    if (event.target.closest('[data-action="remove"]')) {
      removeCard(item.dataset.id);
      return;
    }
    /* Let the buy link do its job without flipping the card back. */
    if (event.target.closest('a')) return;

    flip(item, !item.classList.contains('is-flipped'));
  });

  function removeCard(id) {
    var card = userCards.find(function (c) { return c.id === id; });
    if (!card || !window.confirm('Remove "' + card.name + '" from your locker?')) return;
    userCards = userCards.filter(function (c) { return c.id !== id; });
    saveUserCards();
    render();
  }

  searchInput.addEventListener('input', render);

  sortSelect.addEventListener('change', function () {
    try { localStorage.setItem(STORE_SORT, sortSelect.value); } catch (err) { /* private mode */ }
    render();
  });

  /* -------------------------------------------------------------- add sheet */

  document.getElementById('add-open').addEventListener('click', openSheet);
  document.getElementById('add-close').addEventListener('click', closeSheet);
  document.getElementById('add-cancel').addEventListener('click', closeSheet);

  function openSheet() {
    resetForm();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closeSheet() {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  function resetForm() {
    form.reset();
    pendingImage = null;
    preview.hidden = true;
    preview.removeAttribute('src');
    uploadText.hidden = false;
    formError.hidden = true;
  }

  fileInput.addEventListener('change', function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) return;
    formError.hidden = true;

    shrinkImage(file, function (dataUrl, error) {
      if (error) {
        showError('That image could not be read. Try another photo.');
        return;
      }
      pendingImage = dataUrl;
      preview.src = dataUrl;
      preview.hidden = false;
      uploadText.hidden = true;
    });
  });

  /* Downscale on a canvas: phone photos are far too large for localStorage. */
  function shrinkImage(file, done) {
    var reader = new FileReader();
    reader.onerror = function () { done(null, true); };
    reader.onload = function () {
      var img = new Image();
      img.onerror = function () { done(null, true); };
      img.onload = function () {
        var scale = Math.min(1, MAX_IMAGE_PX / Math.max(img.width, img.height));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          done(canvas.toDataURL('image/jpeg', 0.82));
        } catch (err) {
          done(String(reader.result)); // e.g. an SVG that taints the canvas
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function showError(message) {
    formError.textContent = message;
    formError.hidden = false;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var name = document.getElementById('f-name').value.trim();
    var price = parseFloat(document.getElementById('f-price').value);

    if (!pendingImage) return showError('Add a photo of the card first.');
    if (!name) return showError('Give the card a name.');
    if (isNaN(price) || price < 0) return showError('Enter a price of 0 or more.');

    var psaValue = document.getElementById('f-psa').value;
    var year = parseInt(document.getElementById('f-year').value, 10);

    var card = {
      id: 'user-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name,
      set: document.getElementById('f-set').value.trim(),
      year: isNaN(year) ? '' : year,
      price: price,
      psa: psaValue ? parseInt(psaValue, 10) : null,
      buyUrl: document.getElementById('f-buy').value.trim(),
      image: pendingImage,
      addedAt: new Date().toISOString(),
      custom: true,
    };

    userCards.push(card);
    try {
      saveUserCards();
    } catch (err) {
      userCards.pop();
      return showError('Not enough storage left on this device for another photo.');
    }

    closeSheet();
    sortSelect.value = 'added-desc';
    searchInput.value = '';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ------------------------------------------------------------------ start */

  try {
    var savedSort = localStorage.getItem(STORE_SORT);
    if (savedSort && SORTERS[savedSort]) sortSelect.value = savedSort;
  } catch (err) { /* private mode */ }

  render();
})();
