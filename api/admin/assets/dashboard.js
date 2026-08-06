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
    overview: ["工程概览", "跟踪分析任务与专业服务交付状态", "搜索任务或项目"],
    tasks: ["分析任务", "查看计算队列、任务状态与失败诊断", "搜索任务或分析类型"],
    files: ["数据文件", "管理测试数据包、校验状态与存储", "搜索文件或项目"],
    reports: ["分析报告", "跟踪报告生成、复核与交付", "搜索报告或项目"],
    skills: ["Skill 请求", "管理专业 Skill 的需求与交付阶段", "搜索 Skill 或场景"],
    mcp: ["MCP 服务", "查看专业工具服务与能力边界", "搜索 MCP 服务"],
    projects: ["工程项目", "查看项目进度、数据与交付节点", "搜索工程项目"],
    keys: ["访问凭据", "管理专业 API 的项目级访问范围", "搜索凭据或权限"],
    logs: ["调用日志", "检查专业 API 请求结果与延迟", "搜索路径或任务"],
    settings: ["项目设置", "配置项目默认值与通知策略", "搜索设置项"]
  };

  function showToast(message) {
    toast.textContent = message || "静态原型：此操作尚未连接后端。";
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
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && body.classList.contains("nav-open")) setNav(false);
  });

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
    if (count) count.textContent = "显示 " + visible + " 个任务";
  }

  function showView(view, options) {
    var meta = viewMeta[view] || viewMeta.overview;
    document.querySelectorAll("[data-view]").forEach(function (section) {
      section.hidden = section.dataset.view !== view;
    });
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
    document.title = meta[0] + " · NVH API 控制台";
    if (!options || !options.keepScroll) window.scrollTo(0, 0);
    if (window.innerWidth <= 820) setNav(false);
  }

  document.querySelectorAll("[data-view-link]").forEach(function (link) {
    link.addEventListener("click", function () {
      if (getActiveView() === link.dataset.viewLink) showView(link.dataset.viewLink);
    });
  });
  window.addEventListener("hashchange", function () { showView(getActiveView()); });
  search.addEventListener("input", filterActiveView);

  var chartSets = {
    "7": { labels: ["周二", "周三", "周四", "周五", "周六", "周日", "周一"], submitted: [18, 24, 20, 31, 16, 22, 32], completed: [17, 21, 19, 28, 15, 20, 28], total: [163, 148] },
    "30": { labels: ["第1周", "第2周", "第3周", "第4周", "本周", "", ""], submitted: [74, 96, 88, 112, 63, 0, 0], completed: [69, 91, 83, 105, 57, 0, 0], total: [433, 405] },
    "90": { labels: ["5月", "6月", "7月", "", "", "", ""], submitted: [382, 451, 433, 0, 0, 0, 0], completed: [365, 428, 405, 0, 0, 0, 0], total: [1266, 1198] }
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
      group.innerHTML = '<span class="bar bar-submitted" style="height:' + (data.submitted[index] / max * 100) + '%" title="提交 ' + data.submitted[index] + '"></span>' +
        '<span class="bar bar-completed" style="height:' + (data.completed[index] / max * 100) + '%" title="完成 ' + data.completed[index] + '"></span>' +
        '<span class="bar-label">' + label + '</span>';
      chart.appendChild(group);
    });
    chart.setAttribute("aria-label", "最近 " + range + " 天分析任务趋势图");
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
  document.querySelectorAll(".segmented button:not([data-range])").forEach(function (button) {
    button.addEventListener("click", function () {
      button.parentElement.querySelectorAll("button").forEach(function (item) { item.setAttribute("aria-pressed", "false"); });
      button.setAttribute("aria-pressed", "true");
    });
  });
  document.querySelectorAll("[data-demo-action]").forEach(function (button) {
    button.addEventListener("click", function () { showToast(); });
  });

  showView(getActiveView(), { keepScroll: true });
})();
