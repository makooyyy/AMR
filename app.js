(function () {
  "use strict";

  var STORAGE_KEY = "manhwa-tracker:data:v1";

  var DEFAULT_CRITERIA = ["Рисовка", "Сюжет", "Персонажи", "Динамика", "Атмосфера"];

  var STATUSES = [
    { id: "reading", label: "Читаю", color: "#3B6FD9" },
    { id: "done", label: "Завершено", color: "#2E9E6B" },
    { id: "dropped", label: "Дропнул", color: "#8B8578" },
    { id: "plan", label: "В планах", color: "#D98E2B" }
  ];

  var state = {
    manhwas: [],
    tab: "library",
    selectedId: null,
    sortMode: "recent",
    addingManhwa: false,
    addingCriterion: false,
    confirmClear: false,
    error: null
  };

  /* ---------- helpers ---------- */
  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s == null ? "" : String(s);
    return div.innerHTML;
  }

  function average(criteria) {
    if (!criteria.length) return null;
    var sum = 0;
    for (var i = 0; i < criteria.length; i++) sum += criteria[i].score;
    return sum / criteria.length;
  }

  function scoreColor(v) {
    if (v === null || v === undefined) return "#8B8578";
    if (v < 5) return "#E63950";
    if (v < 7.5) return "#D98E2B";
    return "#2E9E6B";
  }

  function statusById(id) {
    for (var i = 0; i < STATUSES.length; i++) if (STATUSES[i].id === id) return STATUSES[i];
    return STATUSES[0];
  }

  function criteriaWord(n) {
    var mod10 = n % 10, mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return "критерий";
    if ([2, 3, 4].indexOf(mod10) !== -1 && [12, 13, 14].indexOf(mod100) === -1) return "критерия";
    return "критериев";
  }

  function newManhwa(title) {
    return {
      id: uid(),
      title: title,
      status: "reading",
      criteria: DEFAULT_CRITERIA.map(function (name) {
        return { id: uid(), name: name, score: 5 };
      })
    };
  }

  function findManhwa(id) {
    for (var i = 0; i < state.manhwas.length; i++) if (state.manhwas[i].id === id) return state.manhwas[i];
    return null;
  }

  /* ---------- persistence ---------- */
  function load() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      state.manhwas = raw ? JSON.parse(raw) : [];
    } catch (e) {
      state.manhwas = [];
    }
  }

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.manhwas));
      state.error = null;
    } catch (e) {
      state.error = "Не удалось сохранить данные на этом устройстве.";
    }
  }

  /* ---------- svg pieces ---------- */
  function stampHtml(value, size) {
    size = size || 58;
    var color = scoreColor(value);
    var display = value === null || value === undefined ? "—" : value.toFixed(1);
    return (
      '<div class="mt-stamp" style="width:' + size + "px;height:" + size + "px;" +
      "border:3px solid " + color + ";box-shadow:0 0 0 2.5px " + color + "33;" +
      "background:" + color + '12;">' +
      '<span style="font-size:' + (size * 0.36) + "px;color:" + color + ';">' + display + "</span>" +
      "</div>"
    );
  }

  function radarSvg(criteria, opts) {
    opts = opts || {};
    var size = opts.size || 220;
    var fill = opts.fillColor || "#E63950";
    var dot = opts.dotColor || "#D98E2B";
    var n = criteria.length;

    if (n < 3) {
      return (
        '<div style="height:' + size * 0.6 + "px;display:flex;align-items:center;justify-content:center;" +
        'color:#8B8578;font-size:13px;text-align:center;padding:0 20px;">' +
        "Нужно хотя бы 3 критерия для диаграммы</div>"
      );
    }

    var center = size / 2;
    var maxR = size / 2 - 26;

    function ringPts(scale) {
      var pts = [];
      for (var i = 0; i < n; i++) {
        var angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        var r = maxR * scale;
        pts.push([center + r * Math.cos(angle), center + r * Math.sin(angle)]);
      }
      return pts;
    }

    function toPolygon(pts) {
      return pts.map(function (p) { return p[0] + "," + p[1]; }).join(" ");
    }

    var valuePoints = criteria.map(function (c, i) {
      var angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      var r = maxR * (c.score / 10);
      return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
    });

    var svg = '<svg width="' + size + '" height="' + size + '" style="overflow:visible">';

    [0.25, 0.5, 0.75, 1].forEach(function (s) {
      svg +=
        '<polygon points="' + toPolygon(ringPts(s)) + '" fill="none" stroke="#1A1822" ' +
        'stroke-opacity="0.18" stroke-dasharray="3,3" />';
    });

    criteria.forEach(function (c, i) {
      var angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      var x = center + maxR * Math.cos(angle);
      var y = center + maxR * Math.sin(angle);
      svg += '<line x1="' + center + '" y1="' + center + '" x2="' + x + '" y2="' + y +
        '" stroke="#1A1822" stroke-opacity="0.18" />';
    });

    svg += '<polygon points="' + toPolygon(valuePoints) + '" fill="' + fill +
      '" fill-opacity="0.28" stroke="' + fill + '" stroke-width="2" />';

    valuePoints.forEach(function (p) {
      svg += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="' + dot +
        '" stroke="#1A1822" stroke-width="1.2" />';
    });

    criteria.forEach(function (c, i) {
      var angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      var lx = center + (maxR + 20) * Math.cos(angle);
      var ly = center + (maxR + 20) * Math.sin(angle);
      var label = c.name.length > 10 ? c.name.slice(0, 9) + "…" : c.name;
      svg += '<text x="' + lx + '" y="' + ly + '" text-anchor="middle" dominant-baseline="middle" ' +
        'font-family="Manrope, sans-serif" font-weight="700" font-size="11" fill="#1A1822">' +
        escapeHtml(label) + "</text>";
    });

    svg += "</svg>";
    return svg;
  }

  function statusBadgeHtml(statusId, extraAttrs) {
    var s = statusById(statusId);
    return (
      '<button class="mt-status-badge" style="border-color:' + s.color + ";color:" + s.color +
      ";background:" + s.color + '18;" ' + (extraAttrs || "") + ">" + s.label + "</button>"
    );
  }

  /* ---------- view: library ---------- */
  function sortedManhwas() {
    var arr = state.manhwas.slice();
    if (state.sortMode === "rating") {
      arr.sort(function (a, b) {
        var av = average(a.criteria), bv = average(b.criteria);
        return (bv === null ? -1 : bv) - (av === null ? -1 : av);
      });
    } else if (state.sortMode === "title") {
      arr.sort(function (a, b) { return a.title.localeCompare(b.title, "ru"); });
    } else {
      arr.reverse();
    }
    return arr;
  }

  function renderHeader() {
    var sorts = [["recent", "новые"], ["rating", "оценка"], ["title", "А-Я"]];
    var btns = sorts.map(function (s) {
      var active = state.sortMode === s[0];
      return (
        '<button class="mt-sort-btn' + (active ? " active" : "") + '" data-sort="' + s[0] + '">' +
        s[1] + "</button>"
      );
    }).join("");

    return (
      '<div class="mt-header">' +
      '<div class="mt-title">МАНХВА<span class="accent">•</span>ТРЕКЕР</div>' +
      '<div class="mt-subrow">' +
      '<div class="mt-subtitle">Рисовка, сюжет, персонажи — раздельно</div>' +
      '<div class="mt-sort-group">' + btns + "</div>" +
      "</div></div>"
    );
  }

  function renderErrorBanner() {
    if (!state.error) return "";
    return '<div class="mt-error">' + escapeHtml(state.error) + "</div>";
  }

  function renderLibrary() {
    var html = renderHeader() + renderErrorBanner() + '<div class="mt-list">';
    var list = sortedManhwas();

    if (list.length === 0 && !state.addingManhwa) {
      html +=
        '<div class="mt-paper mt-empty"><div class="mt-empty-title">Пока пусто</div>' +
        '<div class="mt-empty-text">Добавь манхву — оценишь рисовку, сюжет, персонажей и всё остальное по отдельности.</div></div>';
    }

    list.forEach(function (m, idx) {
      var avg = average(m.criteria);
      html +=
        '<div class="mt-paper ' + (idx % 2 === 0 ? "mt-tilt-a" : "mt-tilt-b") + ' mt-card-row" data-card-id="' + m.id + '">' +
        '<div class="mt-card-main" data-open-id="' + m.id + '">' +
        '<div class="mt-card-title">' + escapeHtml(m.title) + "</div>" +
        '<div class="mt-card-meta">' +
        statusBadgeHtml(m.status, 'data-cycle-id="' + m.id + '"') +
        '<span class="mt-meta-count">' + m.criteria.length + " " + criteriaWord(m.criteria.length) + "</span>" +
        "</div></div>" +
        '<div data-open-id="' + m.id + '">' + stampHtml(avg, 58) + "</div>" +
        '<button class="mt-icon-btn" data-delete-id="' + m.id + '" aria-label="Удалить">✕</button>' +
        "</div>";
    });

    if (state.addingManhwa) {
      html +=
        '<div class="mt-paper">' +
        '<input class="mt-input" id="new-title-input" placeholder="Название манхвы" />' +
        '<div class="mt-form-row">' +
        '<button class="mt-primary-btn" id="confirm-add-manhwa">Добавить</button>' +
        '<button class="mt-ghost-btn" id="cancel-add-manhwa">Отмена</button>' +
        "</div></div>";
    } else {
      html += '<button class="mt-add-btn" id="start-add-manhwa">+ Добавить манхву</button>';
    }

    html += "</div>";
    return html;
  }

  /* ---------- view: detail ---------- */
  function renderDetail(m) {
    var avg = average(m.criteria);
    var html =
      '<div class="mt-detail-head">' +
      '<button class="mt-icon-btn on-dark" id="back-btn" aria-label="Назад">←</button>' +
      '<div class="mt-detail-title">' + escapeHtml(m.title) + "</div>" +
      "</div>" +
      '<div class="mt-detail-status">' + statusBadgeHtml(m.status, 'data-cycle-id="' + m.id + '"') + "</div>" +
      renderErrorBanner() +
      '<div class="mt-detail-body">' +
      '<div class="mt-paper mt-radar-panel">' + radarSvg(m.criteria, {}) + stampHtml(avg, 50) + "</div>" +
      '<div class="mt-paper mt-criteria-panel">';

    m.criteria.forEach(function (c) {
      var color = scoreColor(c.score);
      var removable = m.criteria.length > 1;
      html +=
        '<div class="mt-crit-row" data-crit-id="' + c.id + '">' +
        '<div class="mt-crit-top">' +
        '<span class="mt-crit-name">' + escapeHtml(c.name) + "</span>" +
        '<div class="mt-crit-right">' +
        '<span class="mt-crit-score" data-score-label="' + c.id + '" style="color:' + color + '">' +
        c.score.toFixed(1) + "</span>" +
        (removable ? '<button class="mt-icon-btn" data-delete-crit="' + c.id + '" aria-label="Удалить критерий">✕</button>' : "") +
        "</div></div>" +
        '<input type="range" class="mt-slider" min="1" max="10" step="0.5" value="' + c.score +
        '" data-slider-crit="' + c.id + '" />' +
        "</div>";
    });

    html += "</div>";

    if (state.addingCriterion) {
      html +=
        '<div class="mt-paper">' +
        '<input class="mt-input" id="new-crit-input" placeholder="Свой критерий (напр. Саундтрек, Перевод)" />' +
        '<div class="mt-form-row">' +
        '<button class="mt-primary-btn" id="confirm-add-crit">Добавить</button>' +
        '<button class="mt-ghost-btn" id="cancel-add-crit">Отмена</button>' +
        "</div></div>";
    } else {
      html += '<button class="mt-add-btn" id="start-add-crit">+ Свой критерий</button>';
    }

    html += "</div>";
    return html;
  }

  /* ---------- view: profile ---------- */
  function aggregateCriteria() {
    var map = {};
    state.manhwas.forEach(function (m) {
      m.criteria.forEach(function (c) {
        if (!map[c.name]) map[c.name] = { sum: 0, count: 0 };
        map[c.name].sum += c.score;
        map[c.name].count += 1;
      });
    });
    var extraNames = Object.keys(map).filter(function (k) { return DEFAULT_CRITERIA.indexOf(k) === -1; });
    var order = DEFAULT_CRITERIA.concat(extraNames);
    return order
      .filter(function (name) { return map[name]; })
      .map(function (name) {
        return { id: name, name: name, score: map[name].sum / map[name].count, count: map[name].count };
      })
      .slice(0, 8);
  }

  function miniRowHtml(m) {
    var avg = average(m.criteria);
    return (
      '<div class="mt-mini-row" data-open-id="' + m.id + '">' +
      '<div class="mt-mini-title">' + escapeHtml(m.title) + "</div>" +
      '<span class="mt-mini-score" style="color:' + scoreColor(avg) + '">' +
      (avg === null ? "—" : avg.toFixed(1)) + "</span></div>"
    );
  }

  function renderProfile() {
    var rated = state.manhwas.filter(function (m) { return m.criteria.length > 0; });
    var overallAvg = rated.length
      ? rated.reduce(function (a, m) { return a + average(m.criteria); }, 0) / rated.length
      : null;

    var html =
      '<div class="mt-profile-head">' +
      '<div class="mt-profile-title">ПРОФИЛЬ<span style="color:#E63950">.</span></div>' +
      '<div class="mt-profile-sub">Статистика по всей библиотеке</div>' +
      "</div>" + renderErrorBanner() +
      '<div class="mt-list">' +
      '<div class="mt-chip-row">' +
      '<div class="mt-chip"><div class="mt-chip-value">' + state.manhwas.length + '</div><div class="mt-chip-label">манхв в списке</div></div>' +
      '<div class="mt-chip"><div class="mt-chip-value" style="color:' + scoreColor(overallAvg) + '">' +
      (overallAvg === null ? "—" : overallAvg.toFixed(1)) + '</div><div class="mt-chip-label">средняя оценка</div></div>' +
      "</div>";

    // status bar
    var total = state.manhwas.length || 1;
    var track = "";
    var legend = "";
    STATUSES.forEach(function (s) {
      var count = state.manhwas.filter(function (m) { return m.status === s.id; }).length;
      var pct = (count / total) * 100;
      if (pct > 0) track += '<div style="width:' + pct + "%;background:" + s.color + ';" title="' + s.label + '"></div>';
      legend +=
        '<div class="mt-legend-item"><span class="mt-legend-dot" style="background:' + s.color + '"></span>' +
        '<span class="mt-legend-label">' + s.label + " · " + count + "</span></div>";
    });
    html +=
      '<div class="mt-paper"><div class="mt-panel-title">СТАТУСЫ</div>' +
      '<div class="mt-status-track">' + track + "</div>" +
      '<div class="mt-status-legend">' + legend + "</div></div>";

    var agg = aggregateCriteria();
    if (agg.length >= 3) {
      html +=
        '<div class="mt-paper mt-radar-panel" style="align-items:flex-start">' +
        '<div class="mt-panel-title">СРЕДНЕЕ ПО КРИТЕРИЯМ</div>' +
        '<div style="width:100%;display:flex;justify-content:center">' +
        radarSvg(agg, { fillColor: "#3B6FD9", dotColor: "#D98E2B" }) + "</div></div>";
    }

    if (agg.length > 0) {
      var bars = agg.slice().sort(function (a, b) { return b.score - a.score; }).map(function (c) {
        return (
          '<div class="mt-bar-row"><span class="mt-bar-name">' + escapeHtml(c.name) + "</span>" +
          '<div class="mt-bar-track"><div class="mt-bar-fill" style="width:' + (c.score / 10) * 100 +
          "%;background:" + scoreColor(c.score) + ';"></div></div>' +
          '<span class="mt-bar-value" style="color:' + scoreColor(c.score) + '">' + c.score.toFixed(1) + "</span></div>"
        );
      }).join("");
      html += '<div class="mt-paper"><div class="mt-panel-title">ЧТО ТЫ ЦЕНИШЬ ВЫШЕ ВСЕГО</div>' + bars + "</div>";
    }

    var sortedByScore = rated.slice().sort(function (a, b) { return average(b.criteria) - average(a.criteria); });
    var top = sortedByScore.slice(0, 3);
    var bottom = sortedByScore.slice(-3).reverse().filter(function (m) { return top.indexOf(m) === -1; });

    if (top.length > 0) {
      html +=
        '<div class="mt-paper"><div class="mt-panel-title" style="color:#2E9E6B">ТОП ПО ОЦЕНКЕ</div>' +
        top.map(miniRowHtml).join("") + "</div>";
    }
    if (bottom.length > 0) {
      html +=
        '<div class="mt-paper"><div class="mt-panel-title" style="color:#E63950">АУТСАЙДЕРЫ</div>' +
        bottom.map(miniRowHtml).join("") + "</div>";
    }

    if (state.manhwas.length === 0) {
      html +=
        '<div class="mt-paper mt-empty"><div class="mt-empty-text">Статистика появится, как только добавишь и оценишь первую манхву.</div></div>';
    }

    html +=
      '<div class="mt-paper"><div class="mt-panel-title">РЕЗЕРВНАЯ КОПИЯ</div>' +
      '<div class="mt-backup-text">Сохрани файл с оценками себе на телефон — так данные ' +
      'не потеряются при очистке браузера, и их можно перенести на другое устройство.</div>' +
      '<div class="mt-form-row">' +
      '<button class="mt-ghost-btn" id="export-btn" style="flex:1">⭳ Сохранить в файл</button>' +
      '<button class="mt-ghost-btn" id="import-btn" style="flex:1">⭱ Загрузить из файла</button>' +
      "</div>" +
      '<input type="file" id="import-file-input" accept="application/json" style="display:none" />' +
      "</div>";

    html +=
      '<div class="mt-clear-wrap"><button class="mt-clear-btn' + (state.confirmClear ? " confirm" : "") +
      '" id="clear-all-btn">' +
      (state.confirmClear ? "Точно удалить всё? Нажми ещё раз" : "Очистить все данные") +
      "</button></div>";

    html += "</div>";
    return html;
  }

  /* ---------- tabbar ---------- */
  function renderTabbar() {
    var tabs = [["library", "Библиотека"], ["profile", "Профиль"]];
    var inner = tabs.map(function (t) {
      var active = state.tab === t[0];
      return '<button class="mt-tab' + (active ? " active" : "") + '" data-tab="' + t[0] + '">' + t[1] + "</button>";
    }).join("");
    return '<div class="mt-tabbar"><div class="mt-tabbar-inner">' + inner + "</div></div>";
  }

  /* ---------- main render ---------- */
  function render() {
    var app = document.getElementById("app");
    var selected = state.selectedId ? findManhwa(state.selectedId) : null;
    if (state.selectedId && !selected) state.selectedId = null;

    var body;
    if (selected) {
      body = renderDetail(selected);
    } else if (state.tab === "library") {
      body = renderLibrary();
    } else {
      body = renderProfile();
    }

    var showTabs = !selected;
    app.innerHTML = '<div class="mt-shell">' + body + "</div>" + (showTabs ? renderTabbar() : "");
    attachHandlers(selected);
    window.scrollTo(0, 0);
  }

  /* ---------- event handlers ---------- */
  function attachHandlers(selected) {
    var app = document.getElementById("app");

    // tabs
    app.querySelectorAll("[data-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.tab = btn.getAttribute("data-tab");
        state.addingManhwa = false;
        render();
      });
    });

    // sort
    app.querySelectorAll("[data-sort]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.sortMode = btn.getAttribute("data-sort");
        render();
      });
    });

    // open manhwa
    app.querySelectorAll("[data-open-id]").forEach(function (el) {
      el.addEventListener("click", function () {
        state.selectedId = el.getAttribute("data-open-id");
        render();
      });
    });

    // cycle status
    app.querySelectorAll("[data-cycle-id]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = btn.getAttribute("data-cycle-id");
        var m = findManhwa(id);
        if (!m) return;
        var idx = STATUSES.findIndex(function (s) { return s.id === m.status; });
        m.status = STATUSES[(idx + 1) % STATUSES.length].id;
        save();
        render();
      });
    });

    // delete manhwa
    app.querySelectorAll("[data-delete-id]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = btn.getAttribute("data-delete-id");
        state.manhwas = state.manhwas.filter(function (m) { return m.id !== id; });
        if (state.selectedId === id) state.selectedId = null;
        save();
        render();
      });
    });

    // add manhwa flow
    var startAdd = document.getElementById("start-add-manhwa");
    if (startAdd) startAdd.addEventListener("click", function () {
      state.addingManhwa = true;
      render();
      var inp = document.getElementById("new-title-input");
      if (inp) inp.focus();
    });

    var cancelAdd = document.getElementById("cancel-add-manhwa");
    if (cancelAdd) cancelAdd.addEventListener("click", function () {
      state.addingManhwa = false;
      render();
    });

    var confirmAdd = document.getElementById("confirm-add-manhwa");
    var titleInput = document.getElementById("new-title-input");
    function submitNewManhwa() {
      var val = titleInput ? titleInput.value.trim() : "";
      if (!val) return;
      state.manhwas.push(newManhwa(val));
      state.addingManhwa = false;
      save();
      render();
    }
    if (confirmAdd) confirmAdd.addEventListener("click", submitNewManhwa);
    if (titleInput) titleInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") submitNewManhwa();
    });

    // back button
    var backBtn = document.getElementById("back-btn");
    if (backBtn) backBtn.addEventListener("click", function () {
      state.selectedId = null;
      state.addingCriterion = false;
      render();
    });

    // criterion sliders — live label update on input, full save+render on change
    app.querySelectorAll("[data-slider-crit]").forEach(function (slider) {
      var critId = slider.getAttribute("data-slider-crit");
      slider.addEventListener("input", function () {
        var val = parseFloat(slider.value);
        var label = app.querySelector('[data-score-label="' + critId + '"]');
        if (label) {
          label.textContent = val.toFixed(1);
          label.style.color = scoreColor(val);
        }
        if (selected) {
          var c = selected.criteria.find(function (cc) { return cc.id === critId; });
          if (c) c.score = val;
        }
      });
      slider.addEventListener("change", function () {
        save();
        render();
      });
    });

    // delete criterion
    app.querySelectorAll("[data-delete-crit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!selected) return;
        var critId = btn.getAttribute("data-delete-crit");
        selected.criteria = selected.criteria.filter(function (c) { return c.id !== critId; });
        save();
        render();
      });
    });

    // add criterion flow
    var startAddCrit = document.getElementById("start-add-crit");
    if (startAddCrit) startAddCrit.addEventListener("click", function () {
      state.addingCriterion = true;
      render();
      var inp = document.getElementById("new-crit-input");
      if (inp) inp.focus();
    });
    var cancelAddCrit = document.getElementById("cancel-add-crit");
    if (cancelAddCrit) cancelAddCrit.addEventListener("click", function () {
      state.addingCriterion = false;
      render();
    });
    var confirmAddCrit = document.getElementById("confirm-add-crit");
    var critInput = document.getElementById("new-crit-input");
    function submitNewCrit() {
      var val = critInput ? critInput.value.trim() : "";
      if (!val || !selected) return;
      selected.criteria.push({ id: uid(), name: val, score: 5 });
      state.addingCriterion = false;
      save();
      render();
    }
    if (confirmAddCrit) confirmAddCrit.addEventListener("click", submitNewCrit);
    if (critInput) critInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") submitNewCrit();
    });

    // export to file
    var exportBtn = document.getElementById("export-btn");
    if (exportBtn) exportBtn.addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(state.manhwas, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      var date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = "manhwa-tracker-backup-" + date + ".json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    // import from file
    var importBtn = document.getElementById("import-btn");
    var importInput = document.getElementById("import-file-input");
    if (importBtn && importInput) {
      importBtn.addEventListener("click", function () { importInput.click(); });
      importInput.addEventListener("change", function () {
        var file = importInput.files && importInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var parsed = JSON.parse(reader.result);
            if (!Array.isArray(parsed)) throw new Error("bad format");
            var replace = state.manhwas.length === 0 ||
              window.confirm("Заменить текущий список (" + state.manhwas.length +
                ") данными из файла (" + parsed.length + ")? Текущие оценки будут удалены.");
            if (replace) {
              state.manhwas = parsed;
              state.error = null;
              save();
              render();
            }
          } catch (e) {
            state.error = "Не удалось прочитать файл — проверь, что это резервная копия из этого приложения.";
            render();
          }
        };
        reader.readAsText(file);
        importInput.value = "";
      });
    }

    // clear all
    var clearBtn = document.getElementById("clear-all-btn");
    if (clearBtn) clearBtn.addEventListener("click", function () {
      if (state.confirmClear) {
        state.manhwas = [];
        state.selectedId = null;
        state.confirmClear = false;
        save();
        render();
      } else {
        state.confirmClear = true;
        render();
        setTimeout(function () {
          state.confirmClear = false;
        }, 4000);
      }
    });
  }

  /* ---------- boot ---------- */
  load();
  render();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js").catch(function () {});
    });
  }
})();
