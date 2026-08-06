(function () {
  "use strict";
  var body = document.body;
  var navToggle = document.querySelector("[data-nav-toggle]");
  var navClose = document.querySelector("[data-nav-close]");
  var sidebar = document.getElementById("sidebar");
  var toast = document.querySelector("[data-toast]");
  var pageTitle = document.querySelector("[data-page-title]");
  var pageSubtitle = document.querySelector("[data-page-subtitle]");
  var search = document.querySelector("[data-table-search]");
  var toastTimer;

  var viewMeta = {
    overview: ["网关概览", "查看模型路由、调用用量与供应商状态", "搜索模型或项目"],
    routes: ["模型路由", "配置逻辑模型、上游策略与故障转移", "搜索路由或供应商"],
    providers: ["供应商状态", "查看上游可用率、延迟与路由权重", "搜索供应商"],
    usage: ["用量分析", "按模型、项目与时间查看请求和成本", "搜索模型或项目"],
    keys: ["API Key", "管理项目密钥、权限与有效期", "搜索 Key 或项目"],
    projects: ["网关项目", "隔离 Key、配额、模型权限与用量", "搜索网关项目"],
    limits: ["速率限制", "查看项目请求、Token 与并发策略", "搜索项目或策略"],
    quota: ["配额与余额", "查看预算使用、项目配额和成本预测", "搜索项目配额"],
    audit: ["审计记录", "查看配置、Key、登录与权限事件", "搜索事件或操作者"],
    settings: ["网关设置", "配置路由默认值、告警与审计策略", "搜索设置项"]
  };

  function showToast(message) {
    toast.textContent = message || "静态原型：此操作尚未连接网关后端。";
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 2600);
  }
  function setNav(open) {
    body.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    if (open) sidebar.querySelector("[data-view-link]").focus();
    else if (document.activeElement && sidebar.contains(document.activeElement)) navToggle.focus();
  }
  navToggle.addEventListener("click", function () { setNav(!body.classList.contains("nav-open")); });
  navClose.addEventListener("click", function () { setNav(false); });
  document.addEventListener("keydown", function (event) { if (event.key === "Escape" && body.classList.contains("nav-open")) setNav(false); });

  function getActiveView() {
    var requested = window.location.hash.slice(1);
    return Object.prototype.hasOwnProperty.call(viewMeta, requested) ? requested : "overview";
  }
  function filterActiveView() {
    var active = document.querySelector("[data-view]:not([hidden])");
    if (!active) return;
    var query = search.value.trim().toLowerCase();
    var items = Array.from(active.querySelectorAll("tbody tr:not([data-empty-row]), .service-card, .project-card"));
    var visible = 0;
    items.forEach(function (item) {
      var match = item.textContent.toLowerCase().includes(query);
      item.hidden = !match;
      if (match) visible += 1;
    });
    var emptyRow = active.querySelector("[data-empty-row]");
    if (emptyRow) emptyRow.hidden = visible !== 0;
    var count = active.querySelector("[data-result-count]");
    if (count) count.textContent = "显示 " + visible + " 条路由";
  }
  function showView(view, options) {
    var meta = viewMeta[view] || viewMeta.overview;
    document.querySelectorAll("[data-view]").forEach(function (section) { section.hidden = section.dataset.view !== view; });
    document.querySelectorAll("[data-view-link]").forEach(function (link) {
      var active = link.dataset.viewLink === view;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    pageTitle.textContent = meta[0];
    pageSubtitle.textContent = meta[1];
    search.placeholder = meta[2];
    search.value = "";
    filterActiveView();
    document.title = meta[0] + " · AI API 网关";
    if (!options || !options.keepScroll) window.scrollTo(0, 0);
    if (window.innerWidth <= 820) setNav(false);
  }
  document.querySelectorAll("[data-view-link]").forEach(function (link) {
    link.addEventListener("click", function () { if (getActiveView() === link.dataset.viewLink) showView(link.dataset.viewLink); });
  });
  window.addEventListener("hashchange", function () { showView(getActiveView()); });
  search.addEventListener("input", filterActiveView);

  var chartSets = {
    "7": { labels: ["周二", "周三", "周四", "周五", "周六", "周日", "周一"], submitted: [22, 26, 24, 31, 20, 27, 34], completed: [21, 25, 23, 30, 19, 26, 33], total: ["184.2K", "181.7K"] },
    "30": { labels: ["第1周", "第2周", "第3周", "第4周", "本周", "", ""], submitted: [118, 132, 126, 149, 98, 0, 0], completed: [116, 130, 124, 147, 96, 0, 0], total: ["623.4K", "613.2K"] },
    "90": { labels: ["5月", "6月", "7月", "", "", "", ""], submitted: [482, 531, 623, 0, 0, 0, 0], completed: [471, 519, 613, 0, 0, 0, 0], total: ["1.64M", "1.60M"] }
  };
  var chart = document.querySelector("[data-chart]");
  function renderChart(range) {
    var data = chartSets[range];
    var max = Math.max.apply(null, data.submitted.concat(data.completed));
    chart.innerHTML = "";
    data.labels.forEach(function (label, index) {
      if (!label) return;
      var group = document.createElement("div");
      group.className = "bar-group";
      group.innerHTML = '<span class="bar bar-submitted" style="height:' + (data.submitted[index] / max * 100) + '%" title="请求 ' + data.submitted[index] + '"></span>' +
        '<span class="bar bar-completed" style="height:' + (data.completed[index] / max * 100) + '%" title="成功 ' + data.completed[index] + '"></span>' +
        '<span class="bar-label">' + label + '</span>';
      chart.appendChild(group);
    });
    chart.setAttribute("aria-label", "最近 " + range + " 天网关调用趋势图");
    document.querySelector("[data-total-submitted]").textContent = data.total[0];
    document.querySelector("[data-total-completed]").textContent = data.total[1];
  }
  renderChart("7");
  document.querySelectorAll("[data-range]").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll("[data-range]").forEach(function (item) { item.setAttribute("aria-pressed", "false"); });
      button.setAttribute("aria-pressed", "true");
      renderChart(button.dataset.range);
    });
  });
  document.querySelectorAll("[data-demo-action]").forEach(function (button) { button.addEventListener("click", function () { showToast(); }); });
  showView(getActiveView(), { keepScroll: true });
})();
