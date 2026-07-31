(function () {
  "use strict";

  var STORAGE_KEY = "manhwa-tracker:data:v1";

  var DEFAULT_CRITERIA = ["Рисовка", "Сюжет", "Персонажи", "Динамика", "Атмосфера"];

  var STATUSES = [
    { id: "reading", label: "Читаю", color: "#6C93FF" },
    { id: "done", label: "Завершено", color: "#34D399" },
    { id: "dropped", label: "Дропнул", color: "#8880A0" },
    { id: "plan", label: "В планах", color: "#F3A93C" }
  ];

  var TYPES = [
    { id: "manhwa", label: "Манхва", color: "#FF5C77" },
    { id: "manga", label: "Манга", color: "#6C93FF" },
    { id: "manhua", label: "Маньхуа", color: "#F3A93C" }
  ];

  var GENRE_SUGGESTIONS = [
    "Экшн", "Романтика", "Фэнтези", "Драма", "Комедия", "Ужасы",
    "Триллер", "Приключения", "Повседневность", "Школа", "Сверхъестественное",
    "Психология", "Спорт", "Меха", "Гарем", "Трагедия"
  ];

  var GENRES = [
    "Экшн", "Романтика", "Фэнтези", "Драма", "Комедия", "Ужасы",
    "Триллер", "Спорт", "Повседневность", "Сверхъестественное",
    "Исекай", "Гарем", "Школа", "Приключения", "Мистика", "Психология"
  ];

  var state = {
    manhwas: [],
    tab: "library",
    selectedId: null,
    sortMode: "recent",
    filterStatus: "all",
    filterGenre: "all",
    searchQuery: "",
    addingManhwa: false,
    pendingType: "manhwa",
    pendingTitleDraft: "",
    pendingCoverDraft: "",
    pendingGenreDraft: "",
    addingCriterion: false,
    confirmClear: false,
    confirmDeleteId: null,
    unlockedIds: {},
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
    if (v === null || v === undefined) return "#8880A0";
    if (v < 5) return "#FF5C77";
    if (v < 7.5) return "#F3A93C";
    return "#34D399";
  }

  function statusById(id) {
    for (var i = 0; i < STATUSES.length; i++) if (STATUSES[i].id === id) return STATUSES[i];
    return STATUSES[0];
  }

  function typeById(id) {
    for (var i = 0; i < TYPES.length; i++) if (TYPES[i].id === id) return TYPES[i];
    return TYPES[0];
  }

  function criteriaWord(n) {
    var mod10 = n % 10, mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return "критерий";
    if ([2, 3, 4].indexOf(mod10) !== -1 && [12, 13, 14].indexOf(mod100) === -1) return "критерия";
    return "критериев";
  }

  function newManhwa(title, type, coverUrl) {
    return {
      id: uid(),
      title: title,
      status: "reading",
      type: type || "manhwa",
      rated: false,
      coverUrl: coverUrl || "",
      genres: [],
      altTitles: { en: "", ja: "", ru: "" },
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
    var fill = opts.fillColor || "#FF5C77";
    var dot = opts.dotColor || "#F3A93C";
    var n = criteria.length;

    if (n < 3) {
      return (
        '<div style="height:' + size * 0.6 + "px;display:flex;align-items:center;justify-content:center;" +
        'color:#9A93AE;font-size:13px;text-align:center;padding:0 20px;">' +
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
        '<polygon points="' + toPolygon(ringPts(s)) + '" fill="none" stroke="#FFFFFF" ' +
        'stroke-opacity="0.10" stroke-dasharray="3,3" />';
    });

    criteria.forEach(function (c, i) {
      var angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      var x = center + maxR * Math.cos(angle);
      var y = center + maxR * Math.sin(angle);
      svg += '<line x1="' + center + '" y1="' + center + '" x2="' + x + '" y2="' + y +
        '" stroke="#FFFFFF" stroke-opacity="0.10" />';
    });

    svg += '<polygon points="' + toPolygon(valuePoints) + '" fill="' + fill +
      '" fill-opacity="0.30" stroke="' + fill + '" stroke-width="2" />';

    valuePoints.forEach(function (p) {
      svg += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="' + dot +
        '" stroke="#120F1A" stroke-width="1.2" />';
    });

    criteria.forEach(function (c, i) {
      var angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      var lx = center + (maxR + 20) * Math.cos(angle);
      var ly = center + (maxR + 20) * Math.sin(angle);
      var label = c.name.length > 10 ? c.name.slice(0, 9) + "…" : c.name;
      svg += '<text x="' + lx + '" y="' + ly + '" text-anchor="middle" dominant-baseline="middle" ' +
        'font-family="Manrope, sans-serif" font-weight="700" font-size="11" fill="#C9C2DA">' +
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

  function statusTagHtml(statusId) {
    var s = statusById(statusId);
    return (
      '<span class="mt-status-badge mt-status-tag" style="border-color:' + s.color + ";color:" + s.color +
      ";background:" + s.color + '18;">' + s.label + "</span>"
    );
  }

  function typeBadgeHtml(typeId, extraAttrs) {
    var t = typeById(typeId);
    return (
      '<button class="mt-status-badge" style="border-color:' + t.color + ";color:" + t.color +
      ";background:" + t.color + '18;" ' + (extraAttrs || "") + ">" + t.label + "</button>"
    );
  }

  function typeTagHtml(typeId) {
    var t = typeById(typeId);
    return (
      '<span class="mt-status-badge mt-status-tag" style="border-color:' + t.color + ";color:" + t.color +
      ";background:" + t.color + '18;">' + t.label + "</span>"
    );
  }

  /* ---------- view: library ---------- */
  function matchesQuery(m, q) {
    if (m.title.toLowerCase().indexOf(q) !== -1) return true;
    if (m.genres && m.genres.some(function (g) { return g.toLowerCase().indexOf(q) !== -1; })) return true;
    var alt = m.altTitles;
    if (!alt) return false;
    return Object.keys(alt).some(function (k) {
      return (alt[k] || "").toLowerCase().indexOf(q) !== -1;
    });
  }

  function allGenresSorted() {
    var counts = {};
    state.manhwas.forEach(function (m) {
      (m.genres || []).forEach(function (g) {
        counts[g] = (counts[g] || 0) + 1;
      });
    });
    return Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
  }

  function sortedManhwas() {
    var arr = state.manhwas.slice();
    if (state.filterStatus !== "all") {
      arr = arr.filter(function (m) { return m.status === state.filterStatus; });
    }
    if (state.filterGenre !== "all") {
      arr = arr.filter(function (m) { return (m.genres || []).indexOf(state.filterGenre) !== -1; });
    }
    if (state.searchQuery.trim()) {
      var q = state.searchQuery.trim().toLowerCase();
      arr = arr.filter(function (m) { return matchesQuery(m, q); });
    }
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

    var filters = [{ id: "all", label: "Все", color: "#9A93AE" }].concat(STATUSES);
    var filterBtns = filters.map(function (f) {
      var active = state.filterStatus === f.id;
      return (
        '<button class="mt-filter-chip' + (active ? " active" : "") + '" data-filter="' + f.id +
        '" style="' + (active ?
          "background:" + f.color + ";color:#120F1A;border-color:" + f.color :
          "border-color:" + f.color + "45;color:" + f.color) + '">' + f.label + "</button>"
      );
    }).join("");

    var query = state.searchQuery || "";
    var clearBtn = query
      ? '<button class="mt-search-clear" id="search-clear-btn" aria-label="Очистить поиск">✕</button>'
      : "";

    var genreList = allGenresSorted();
    var genreRow = "";
    if (genreList.length > 0) {
      var genreChips = [{ id: "all", label: "Все жанры" }]
        .concat(genreList.map(function (g) { return { id: g, label: g }; }))
        .map(function (g) {
          var active = state.filterGenre === g.id;
          return (
            '<button class="mt-genre-filter-chip' + (active ? " active" : "") + '" data-genre-filter="' +
            escapeHtml(g.id) + '">' + escapeHtml(g.label) + "</button>"
          );
        }).join("");
      genreRow = '<div class="mt-genre-filter-row">' + genreChips + "</div>";
    }

    return (
      '<div class="mt-header">' +
      '<div class="mt-title">МАНХВА<span class="accent">•</span>ТРЕКЕР</div>' +
      '<div class="mt-subrow">' +
      '<div class="mt-subtitle">Рисовка, сюжет, персонажи — раздельно</div>' +
      '<div class="mt-sort-group">' + btns + "</div>" +
      "</div>" +
      '<div class="mt-search-wrap">' +
      '<input class="mt-input mt-search-input" id="search-input" placeholder="Поиск по названию или жанру…" value="' +
      escapeHtml(query) + '" />' + clearBtn +
      "</div>" +
      '<div class="mt-filter-row">' + filterBtns + "</div>" +
      genreRow +
      "</div>"
    );
  }

  function renderErrorBanner() {
    if (!state.error) return "";
    return '<div class="mt-error">' + escapeHtml(state.error) + "</div>";
  }

  function renderLibrary() {
    var html = renderHeader() + renderErrorBanner();
    var list = sortedManhwas();

    html += '<div class="mt-list">';

    if (list.length === 0 && !state.addingManhwa) {
      var noneAtAll = state.manhwas.length === 0;
      html += noneAtAll
        ? '<div class="mt-paper mt-empty"><div class="mt-empty-title">Пока пусто</div>' +
          '<div class="mt-empty-text">Добавь манхву — оценишь рисовку, сюжет, персонажей и всё остальное по отдельности.</div></div>'
        : '<div class="mt-paper mt-empty"><div class="mt-empty-title">Ничего не найдено</div>' +
          '<div class="mt-empty-text">Попробуй изменить поиск или фильтр.</div></div>';
    }

    if (list.length > 0) {
      html += '<div class="mt-grid">';
      list.forEach(function (m) {
        var avg = average(m.criteria);
        var accent = scoreColor(avg);
        var st = statusById(m.status);
        var ty = typeById(m.type || "manhwa");
        var confirming = state.confirmDeleteId === m.id;
        var coverStyle = m.coverUrl
          ? "background-image:url('" + escapeHtml(m.coverUrl).replace(/'/g, "%27") + "')"
          : "";

        html +=
          '<div class="mt-grid-card">' +
          '<div class="mt-cover' + (m.coverUrl ? "" : " mt-cover-empty") + '" style="' + coverStyle +
          '" data-open-id="' + m.id + '">' +
          (m.coverUrl ? "" : '<span class="mt-cover-fallback">' + escapeHtml((m.title[0] || "?").toUpperCase()) + "</span>") +
          '<span class="mt-cover-status" style="background:' + st.color + '">' + st.label + "</span>" +
          '<span class="mt-cover-type">' + ty.label + "</span>" +
          '<span class="mt-cover-stamp" style="border-color:' + accent + ";color:" + accent + '">' +
          (avg === null ? "–" : avg.toFixed(1)) + "</span>" +
          '<button class="mt-cover-delete' + (confirming ? " confirm" : "") + '" data-delete-id="' + m.id +
          '" aria-label="Удалить">' + (confirming ? "!" : "✕") + "</button>" +
          "</div>" +
          '<div class="mt-cover-title" data-open-id="' + m.id + '">' + escapeHtml(m.title) + "</div>" +
          "</div>";
      });
      html += "</div>";
    }

    if (state.addingManhwa) {
      var typeBtns = TYPES.map(function (t) {
        var active = state.pendingType === t.id;
        return (
          '<button class="mt-type-choice' + (active ? " active" : "") + '" data-pick-type="' + t.id +
          '" style="' + (active ? "background:" + t.color + ";color:#120F1A;border-color:" + t.color :
            "border-color:" + t.color + "55;color:" + t.color) + '">' + t.label + "</button>"
        );
      }).join("");
      html +=
        '<div class="mt-paper">' +
        '<input class="mt-input" id="new-title-input" placeholder="Название манхвы" value="' +
        escapeHtml(state.pendingTitleDraft) + '" />' +
        '<input class="mt-input" id="new-cover-input" placeholder="Ссылка на обложку (необязательно)" ' +
        'style="margin-top:8px" value="' + escapeHtml(state.pendingCoverDraft) + '" />' +
        '<div class="mt-type-row">' + typeBtns + "</div>" +
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
  function renderAltTitlesPanel(m) {
    var alt = m.altTitles || { en: "", ja: "", ru: "" };
    var fields = [
      ["en", "EN", "Английское название"],
      ["ja", "JP", "Японское название"],
      ["ru", "RU", "Русское название"]
    ];
    var rows = fields.map(function (f) {
      return (
        '<div class="mt-alt-row"><span class="mt-alt-label">' + f[1] + "</span>" +
        '<input class="mt-input" data-alt-lang="' + f[0] + '" placeholder="' + f[2] + '" value="' +
        escapeHtml(alt[f[0]] || "") + '" /></div>'
      );
    }).join("");
    return (
      '<div class="mt-paper">' +
      '<div class="mt-panel-title">АЛЬТЕРНАТИВНЫЕ НАЗВАНИЯ</div>' +
      rows +
      "</div>"
    );
  }

  function renderCoverPanel(m) {
    var url = m.coverUrl || "";
    var preview = url
      ? '<div class="mt-cover-preview" style="background-image:url(\'' + escapeHtml(url).replace(/'/g, "%27") + "')\"></div>"
      : '<div class="mt-cover-preview mt-cover-preview-empty">нет обложки</div>';
    return (
      '<div class="mt-paper">' +
      '<div class="mt-panel-title">ОБЛОЖКА</div>' +
      '<div class="mt-cover-panel-row">' +
      preview +
      '<input class="mt-input" id="cover-url-input" placeholder="Ссылка на изображение (URL)" value="' +
      escapeHtml(url) + '" />' +
      "</div></div>"
    );
  }

  function renderGenresPanel(m) {
    var genres = m.genres || [];
    var chips = genres.length
      ? genres.map(function (g) {
          return (
            '<span class="mt-genre-chip">' + escapeHtml(g) +
            ' <button class="mt-genre-remove" data-remove-genre="' + escapeHtml(g) +
            '" data-manhwa-id="' + m.id + '" aria-label="Убрать жанр">✕</button></span>'
          );
        }).join("")
      : '<span class="mt-empty-text" style="font-size:12px">Пока нет жанров</span>';

    var suggestions = GENRE_SUGGESTIONS.filter(function (g) { return genres.indexOf(g) === -1; });
    var suggBtns = suggestions.map(function (g) {
      return (
        '<button class="mt-genre-suggest" data-add-genre="' + escapeHtml(g) +
        '" data-manhwa-id="' + m.id + '">+ ' + escapeHtml(g) + "</button>"
      );
    }).join("");

    return (
      '<div class="mt-paper">' +
      '<div class="mt-panel-title">ЖАНРЫ</div>' +
      '<div class="mt-genre-list">' + chips + "</div>" +
      (suggBtns ? '<div class="mt-genre-suggest-row">' + suggBtns + "</div>" : "") +
      '<div class="mt-form-row">' +
      '<input class="mt-input" id="new-genre-input" placeholder="Свой жанр" value="' +
      escapeHtml(state.pendingGenreDraft) + '" />' +
      '<button class="mt-primary-btn" id="add-genre-btn" data-manhwa-id="' + m.id +
      '" style="flex:0 0 auto;padding:10px 16px">+</button>' +
      "</div></div>"
    );
  }

  function renderDetail(m) {
    var avg = average(m.criteria);
    var isNew = m.rated === false;
    var unlocked = !!state.unlockedIds[m.id];
    var editable = isNew || unlocked;

    var html =
      '<div class="mt-detail-head">' +
      '<button class="mt-icon-btn on-dark" id="back-btn" aria-label="Назад">←</button>' +
      '<div class="mt-detail-title">' + escapeHtml(m.title) + "</div>" +
      "</div>" +
      '<div class="mt-detail-status">' +
      statusBadgeHtml(m.status, 'data-cycle-id="' + m.id + '"') + " " +
      typeBadgeHtml(m.type || "manhwa", 'data-cycle-type-id="' + m.id + '"') +
      "</div>" +
      renderErrorBanner() +
      '<div class="mt-detail-body">' +
      '<div class="mt-paper mt-radar-panel">' + radarSvg(m.criteria, {}) + stampHtml(avg, 50) + "</div>" +
      '<div class="mt-paper mt-criteria-panel">';

    if (editable) {
      html += '<div class="mt-lock-hint">' + (isNew ? "Выставь оценки — потом можно будет только смотреть" : "Режим редактирования") + "</div>";
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
    } else {
      m.criteria.forEach(function (c) {
        var color = scoreColor(c.score);
        html +=
          '<div class="mt-bar-row"><span class="mt-bar-name">' + escapeHtml(c.name) + "</span>" +
          '<div class="mt-bar-track"><div class="mt-bar-fill" style="width:' + (c.score / 10) * 100 +
          "%;background:" + color + ';"></div></div>' +
          '<span class="mt-bar-value" style="color:' + color + '">' + c.score.toFixed(1) + "</span></div>";
      });
    }

    html += "</div>";

    if (editable) {
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
      html += '<button class="mt-primary-btn" id="finish-rating-btn" data-manhwa-id="' + m.id +
        '" style="width:100%">Готово</button>';
    } else {
      html += '<button class="mt-ghost-btn" id="unlock-rating-btn" data-manhwa-id="' + m.id +
        '" style="width:100%">✎ Изменить оценку</button>';
    }

    html += renderGenresPanel(m) + renderAltTitlesPanel(m) + renderCoverPanel(m);

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
      '<div class="mt-profile-title">ПРОФИЛЬ<span style="color:#FF5C77">.</span></div>' +
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
        radarSvg(agg, { fillColor: "#6C93FF", dotColor: "#F3A93C" }) + "</div></div>";
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

    var genreStats = {};
    state.manhwas.forEach(function (m) {
      (m.genres || []).forEach(function (g) {
        if (!genreStats[g]) genreStats[g] = { count: 0, sum: 0, rated: 0 };
        genreStats[g].count += 1;
        var av = average(m.criteria);
        if (av !== null) { genreStats[g].sum += av; genreStats[g].rated += 1; }
      });
    });
    var genreNames = Object.keys(genreStats).sort(function (a, b) { return genreStats[b].count - genreStats[a].count; }).slice(0, 8);
    if (genreNames.length > 0) {
      var maxCount = Math.max.apply(null, genreNames.map(function (g) { return genreStats[g].count; }));
      var genreBars = genreNames.map(function (g) {
        var s = genreStats[g];
        var avgScore = s.rated ? s.sum / s.rated : null;
        var color = scoreColor(avgScore);
        return (
          '<div class="mt-bar-row"><span class="mt-bar-name">' + escapeHtml(g) + "</span>" +
          '<div class="mt-bar-track"><div class="mt-bar-fill" style="width:' + (s.count / maxCount) * 100 +
          "%;background:" + color + ';"></div></div>' +
          '<span class="mt-bar-value" style="color:' + color + '">' + s.count + "</span></div>"
        );
      }).join("");
      html += '<div class="mt-paper"><div class="mt-panel-title">ЛЮБИМЫЕ ЖАНРЫ</div>' + genreBars + "</div>";
    }

    var sortedByScore = rated.slice().sort(function (a, b) { return average(b.criteria) - average(a.criteria); });
    var top = sortedByScore.slice(0, 3);
    var bottom = sortedByScore.slice(-3).reverse().filter(function (m) { return top.indexOf(m) === -1; });

    if (top.length > 0) {
      html +=
        '<div class="mt-paper"><div class="mt-panel-title" style="color:#34D399">ТОП ПО ОЦЕНКЕ</div>' +
        top.map(miniRowHtml).join("") + "</div>";
    }
    if (bottom.length > 0) {
      html +=
        '<div class="mt-paper"><div class="mt-panel-title" style="color:#FF5C77">АУТСАЙДЕРЫ</div>' +
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

    var activeEl = document.activeElement;
    var focusInfo = null;
    if (activeEl && activeEl.id === "search-input") {
      focusInfo = { start: activeEl.selectionStart, end: activeEl.selectionEnd };
    }

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

    if (focusInfo) {
      var el = document.getElementById("search-input");
      if (el) {
        el.focus();
        try { el.setSelectionRange(focusInfo.start, focusInfo.end); } catch (e) {}
      }
    } else {
      window.scrollTo(0, 0);
    }
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

    app.querySelectorAll("[data-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.filterStatus = btn.getAttribute("data-filter");
        render();
      });
    });

    app.querySelectorAll("[data-genre-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.filterGenre = btn.getAttribute("data-genre-filter");
        render();
      });
    });

    var searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        state.searchQuery = searchInput.value;
        render();
      });
    }
    var searchClear = document.getElementById("search-clear-btn");
    if (searchClear) {
      searchClear.addEventListener("click", function () {
        state.searchQuery = "";
        render();
        var el = document.getElementById("search-input");
        if (el) el.focus();
      });
    }

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

    app.querySelectorAll("[data-cycle-type-id]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = btn.getAttribute("data-cycle-type-id");
        var m = findManhwa(id);
        if (!m) return;
        var idx = TYPES.findIndex(function (t) { return t.id === (m.type || "manhwa"); });
        m.type = TYPES[(idx + 1) % TYPES.length].id;
        save();
        render();
      });
    });

    // delete manhwa (requires confirm tap)
    app.querySelectorAll("[data-delete-id]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = btn.getAttribute("data-delete-id");
        if (state.confirmDeleteId === id) {
          state.manhwas = state.manhwas.filter(function (m) { return m.id !== id; });
          if (state.selectedId === id) state.selectedId = null;
          state.confirmDeleteId = null;
          save();
          render();
        } else {
          state.confirmDeleteId = id;
          render();
          setTimeout(function () {
            if (state.confirmDeleteId === id) {
              state.confirmDeleteId = null;
              render();
            }
          }, 3000);
        }
      });
    });

    // add manhwa flow
    var startAdd = document.getElementById("start-add-manhwa");
    if (startAdd) startAdd.addEventListener("click", function () {
      state.addingManhwa = true;
      state.pendingType = "manhwa";
      state.pendingTitleDraft = "";
      state.pendingCoverDraft = "";
      render();
      var inp = document.getElementById("new-title-input");
      if (inp) inp.focus();
    });

    var cancelAdd = document.getElementById("cancel-add-manhwa");
    if (cancelAdd) cancelAdd.addEventListener("click", function () {
      state.addingManhwa = false;
      state.pendingTitleDraft = "";
      state.pendingCoverDraft = "";
      render();
    });

    app.querySelectorAll("[data-pick-type]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var draftInput = document.getElementById("new-title-input");
        var coverInput = document.getElementById("new-cover-input");
        state.pendingTitleDraft = draftInput ? draftInput.value : "";
        state.pendingCoverDraft = coverInput ? coverInput.value : "";
        state.pendingType = btn.getAttribute("data-pick-type");
        render();
        var inp = document.getElementById("new-title-input");
        if (inp) inp.focus();
      });
    });

    var confirmAdd = document.getElementById("confirm-add-manhwa");
    var titleInput = document.getElementById("new-title-input");
    var coverInputEl = document.getElementById("new-cover-input");
    function submitNewManhwa() {
      var val = titleInput ? titleInput.value.trim() : "";
      if (!val) return;
      var coverVal = coverInputEl ? coverInputEl.value.trim() : "";
      state.manhwas.push(newManhwa(val, state.pendingType, coverVal));
      state.addingManhwa = false;
      state.pendingTitleDraft = "";
      state.pendingCoverDraft = "";
      state.pendingType = "manhwa";
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
      if (state.selectedId) delete state.unlockedIds[state.selectedId];
      state.selectedId = null;
      state.addingCriterion = false;
      state.pendingGenreDraft = "";
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

    // alternative titles
    var finishBtn = document.getElementById("finish-rating-btn");
    if (finishBtn) finishBtn.addEventListener("click", function () {
      var id = finishBtn.getAttribute("data-manhwa-id");
      var m = findManhwa(id);
      if (m) m.rated = true;
      delete state.unlockedIds[id];
      save();
      render();
    });

    var unlockBtn = document.getElementById("unlock-rating-btn");
    if (unlockBtn) unlockBtn.addEventListener("click", function () {
      var id = unlockBtn.getAttribute("data-manhwa-id");
      state.unlockedIds[id] = true;
      render();
    });

    app.querySelectorAll("[data-alt-lang]").forEach(function (input) {
      var lang = input.getAttribute("data-alt-lang");
      input.addEventListener("input", function () {
        if (!selected) return;
        if (!selected.altTitles) selected.altTitles = { en: "", ja: "", ru: "" };
        selected.altTitles[lang] = input.value;
      });
      input.addEventListener("blur", function () {
        save();
      });
    });

    var coverInput = document.getElementById("cover-url-input");
    if (coverInput) {
      coverInput.addEventListener("input", function () {
        if (!selected) return;
        selected.coverUrl = coverInput.value;
      });
      coverInput.addEventListener("blur", function () {
        save();
        render();
      });
    }

    app.querySelectorAll("[data-add-genre]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-manhwa-id");
        var m = findManhwa(id);
        if (!m) return;
        var genre = btn.getAttribute("data-add-genre");
        if (!m.genres) m.genres = [];
        if (m.genres.indexOf(genre) === -1) m.genres.push(genre);
        var draftEl = document.getElementById("new-genre-input");
        state.pendingGenreDraft = draftEl ? draftEl.value : "";
        save();
        render();
      });
    });

    app.querySelectorAll("[data-remove-genre]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-manhwa-id");
        var m = findManhwa(id);
        if (!m) return;
        var genre = btn.getAttribute("data-remove-genre");
        m.genres = (m.genres || []).filter(function (g) { return g !== genre; });
        var draftEl = document.getElementById("new-genre-input");
        state.pendingGenreDraft = draftEl ? draftEl.value : "";
        save();
        render();
      });
    });

    var addGenreBtn = document.getElementById("add-genre-btn");
    var genreInput = document.getElementById("new-genre-input");
    if (addGenreBtn) addGenreBtn.addEventListener("click", function () {
      var id = addGenreBtn.getAttribute("data-manhwa-id");
      var m = findManhwa(id);
      var val = genreInput ? genreInput.value.trim() : "";
      if (!m || !val) return;
      if (!m.genres) m.genres = [];
      if (m.genres.indexOf(val) === -1) m.genres.push(val);
      state.pendingGenreDraft = "";
      save();
      render();
    });
    if (genreInput) genreInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && addGenreBtn) addGenreBtn.click();
    });

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
