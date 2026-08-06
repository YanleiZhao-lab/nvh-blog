(function () {
  function normalize(value) {
    return (value || '').toString().trim().toLowerCase();
  }

  function setupFilterGroup(group) {
    var cards = Array.prototype.slice.call(document.querySelectorAll(group.dataset.target || '[data-filter-card]'));
    var buttons = Array.prototype.slice.call(group.querySelectorAll('[data-filter]'));
    var search = document.querySelector(group.dataset.search || '[data-search]');
    var empty = document.querySelector(group.dataset.empty || '[data-empty-state]');
    var active = 'all';

    function cardMatches(card) {
      var category = normalize(card.dataset.category);
      var tags = normalize(card.dataset.tags);
      var text = normalize(card.textContent);
      var query = normalize(search && search.value);
      var categoryOk = active === 'all' || category === active || tags.indexOf(active) !== -1;
      var queryOk = !query || text.indexOf(query) !== -1 || tags.indexOf(query) !== -1;
      return categoryOk && queryOk;
    }

    function render() {
      var shown = 0;
      cards.forEach(function (card) {
        var ok = cardMatches(card);
        card.hidden = !ok;
        if (ok) shown += 1;
      });
      if (empty) empty.classList.toggle('is-visible', shown === 0);
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        active = normalize(button.dataset.filter || 'all');
        buttons.forEach(function (item) {
          item.setAttribute('aria-pressed', String(item === button));
        });
        render();
      });
    });

    if (search) search.addEventListener('input', render);
    render();
  }

  function setupCopyButtons() {
    Array.prototype.slice.call(document.querySelectorAll('[data-copy]')).forEach(function (button) {
      button.addEventListener('click', function () {
        var value = button.dataset.copy;
        if (!navigator.clipboard) return;
        navigator.clipboard.writeText(value).then(function () {
          var original = button.textContent;
          button.textContent = '已复制';
          window.setTimeout(function () { button.textContent = original; }, 1200);
        });
      });
    });
  }


  function setupChannelPage() {
    var page = document.querySelector('[data-channel-page]');
    if (!page) return;

    var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-channel-tab]'));
    var items = Array.prototype.slice.call(page.querySelectorAll('[data-channel-item]'));
    var search = page.querySelector('[data-channel-search]');
    var title = page.querySelector('[data-channel-title]');
    var visibleCount = page.querySelector('[data-visible-count]');
    var result = page.querySelector('[data-channel-result]');
    var empty = page.querySelector('[data-channel-empty]');
    var toggle = document.querySelector('[data-channel-toggle]');
    var nav = document.querySelector('[data-channel-nav]');
    var active = 'all';

    var names = {
      all: '全部频道',
      test: 'NVH 测试',
      signal: '信号处理',
      cae: 'CAE 仿真',
      paper: '论文与学术',
      tools: '工具开发',
      featured: '精华'
    };

    function countFor(channel) {
      if (channel === 'all') return items.length;
      return items.filter(function (item) { return normalize(item.dataset.channel) === channel; }).length;
    }

    function updateCounts() {
      tabs.forEach(function (tab) {
        var badge = tab.querySelector('[data-count]');
        if (badge) badge.textContent = countFor(normalize(tab.dataset.channel));
      });
    }

    function matches(item) {
      var itemChannel = normalize(item.dataset.channel);
      var tags = normalize(item.dataset.tags);
      var text = normalize(item.textContent);
      var query = normalize(search && search.value);
      var channelOk = active === 'all' || itemChannel === active || tags.indexOf(active) !== -1;
      var queryOk = !query || text.indexOf(query) !== -1 || tags.indexOf(query) !== -1;
      return channelOk && queryOk;
    }

    function render() {
      var shown = 0;
      items.forEach(function (item) {
        var ok = matches(item);
        item.hidden = !ok;
        if (ok) shown += 1;
      });
      tabs.forEach(function (tab) {
        var selected = normalize(tab.dataset.channel) === active;
        tab.classList.toggle('is-active', selected);
        tab.setAttribute('aria-pressed', String(selected));
      });
      if (title) title.textContent = names[active] || '频道';
      if (visibleCount) visibleCount.textContent = shown;
      if (result) result.textContent = '当前显示 ' + shown + ' 篇内容';
      if (empty) empty.classList.toggle('is-visible', shown === 0);
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        active = normalize(tab.dataset.channel || 'all');
        var restoreFocus = window.matchMedia('(max-width: 760px)').matches;
        if (nav) nav.classList.remove('is-open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
        render();
        if (restoreFocus && toggle) toggle.focus({ preventScroll: true });
      });
    });

    if (search) search.addEventListener('input', render);
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = !nav.classList.contains('is-open');
        nav.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
      });
    }

    updateCounts();
    render();
  }


  function setupFilterProxyButtons() {
    Array.prototype.slice.call(document.querySelectorAll('[data-filter-proxy]')).forEach(function (proxy) {
      proxy.addEventListener('click', function () {
        var target = document.querySelector('[data-filter="' + proxy.dataset.filterProxy + '"]');
        if (target) target.click();
        Array.prototype.slice.call(document.querySelectorAll('[data-filter-proxy]')).forEach(function (item) {
          item.classList.toggle('is-active', item === proxy);
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.slice.call(document.querySelectorAll('[data-filter-group]')).forEach(setupFilterGroup);
    setupCopyButtons();
    setupChannelPage();
    setupFilterProxyButtons();
  });
}());


