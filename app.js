(function () {
  "use strict";

  var STORAGE_KEY = "manhwa-tracker:data:v2";

  var DEFAULT_CRITERIA = ["Рисовка", "Сюжет", "Персонажи", "Динамика", "Атмосфера"];

  var STATUSES = [
    { id: "reading", label: "Читаю", color: "#5B8DEF" },
    { id: "done", label: "Прочитано", color: "#4CD97B" },
    { id: "dropped", label: "Брошено", color: "#8880A0" },
    { id: "plan", label: "В планах", color: "#E8A838" }
  ];

  var TYPES = [
    { id: "manhwa", label: "Манхва", color: "#E85D5D" },
    { id: "manga", label: "Манга", color: "#5B8DEF" },
    { id: "manhua", label: "Маньхуа", color: "#E8A838" }
  ];

  var GENRES = [
    { id: "action", label: "Экшен", color: "#E85D5D" },
    { id: "romance", label: "Романтика", color: "#FF6B9D" },
    { id: "fantasy", label: "Фэнтези", color: "#9B6BEF" },
    { id: "isekai", label: "Исекай", color: "#6BEFC0" },
    { id: "drama", label: "Драма", color: "#EF8B6B" },
    { id: "comedy", label: "Комедия", color: "#E8D838" },
    { id: "thriller", label: "Триллер", color: "#6B8BEF" },
    { id: "slice", label: "Повседневность", color: "#8BEF6B" },
    { id: "mystery", label: "Мистика", color: "#6B6BEF" },
    { id: "adventure", label: "Приключения", color: "#EFB36B" },
    { id: "sports", label: "Спорт", color: "#6BEFEF" },
    { id: "horror", label: "Ужасы", color: "#8B0000" },
    { id: "scifi", label: "Sci-Fi", color: "#6BA8EF" },
    { id: "historical", label: "Историческое", color: "#C49B6B" },
    { id: "martial", label: "Боевик", color: "#EF6B6B" }
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
    pendingGenres: [],
    pendingCover: "",
    pendingChaptersRead: 0,
    pendingChaptersTotal: 0,
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
    if (v < 5) return "#E85D5D";
    if (v < 7.5) return "#E8A838";
    return "#4CD97B";
  }

  function statusById(id) {
    for (var i = 0; i < STATUSES.length; i++) if (STATUSES[i].id === id) return STATUSES[i];
    return STATUSES[0];
  }

  function typeById(id) {
    for (var i = 0; i < TYPES.length; i++) if (TYPES[i].id === id) return TYPES[i];
    return TYPES[0];
  }

  function genreById(id) {
    for (var i = 0; i < GENRES.length; i++) if (GENRES[i].id === id) return GENRES[i];
    return null;
  }

  function criteriaWord(n) {
    var mod10 = n % 10, mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return "критерий";
    if ([2, 3, 4].indexOf(mod10) !== -1 && [12, 13, 14].indexOf(mod100) === -1) return "критерия";
    return "критериев";
  }

  function newManhwa(title, type, genres, cover, chaptersRead, chaptersTotal) {
    return {
      id: uid(),
      title: title,
      status: "reading",
      type: type || "manhwa",
      rated: false,
      altTitles: { en: "", ja: "", ru: "" },
      cover: cover || "",
      genres: genres || [],
      chaptersRead: chaptersRead || 0,
      chaptersTotal: chaptersTotal || 0,
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
    size = size || 50;
    var color = scoreColor(value);
    var display = value === null || value === undefined ? "—" : value.toFixed(1);
    return (
      '<div class="mt-stamp" style="width:' + size + "px;height:" + size + "px;" +
      "border:2.5px solid " + color + ";box-shadow:0 0 0 2px " + color + "33;" +
      "background:" + color + '12;">' +
      '<span style="font-size:' + (size * 0.34) + "px;color:" + color + ';">' + display + "</span>" +
      "</div>"
    );
  }

  function bookmarkSvg() {
    return '<svg viewBox="0 0 24 24"><path d="M5 3h14v18l-7-4-7 4V3z"/></svg>';
  }

  function radarSvg(criteria, opts) {
    opts = opts || {};
    var size = opts.size || 220;
    var fill = opts.fillColor || "#E85D5D";
    var dot = opts.dotColor || "#E8A838";
    var n = criteria.length;

    if (n < 3) {
      return (
        '<div style="height:' + size * 0.6 + "px;display:flex;align-items:center;justify-content:center;" +
        'color:#8A8A9A;font-size:13px;text-align:center;padding:0 20px;">' +
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
        'stroke-opacity="0.08" stroke-dasharray="3,3" />';
    });

    criteria.forEach(function (c, i) {
      var angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      var x = center + maxR * Math.cos(angle);
      var y = center + maxR * Math.sin(angle);
      svg += '<line x1="' + center + '" y1="' + center + '" x2="' + x + '" y2="' + y +
        '" stroke="#FFFFFF" stroke-opacity="0.08" />';
    });

    svg += '<polygon points="' + toPolygon(valuePoints) + '" fill="' + fill +
      '" fill-opacity="0.25" stroke="' + fill + '" stroke-width="2" />';

    valuePoints.forEach(function (p) {
      svg += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="' + dot +
        '" stroke="#0D0D12" stroke-width="1.2" />';
    });

    criteria.forEach(function (c, i) {
      var angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      var lx = center + (maxR + 20) * Math.cos(angle);
      var ly = center + (maxR + 20) * Math.sin(angle);
      var label = c.name.length > 10 ? c.name.slice(0, 9) + "…" : c.name;
      svg += '<text x="' + lx + '" y="' + ly + '" text-anchor="middle" dominant-baseline="middle" ' +
        'font-family="Manrope, sans-serif" font-weight="700" font-size="11" fill="#8A8A9A">' +
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

  function genreTagHtml(genreId) {
    var g = genreById(genreId);
    if (!g) return "";
    return (
      '<span class="mt-genre-tag" style="border-color:' + g.color + "55;color:" + g.color +
      ";background:" + g.color + '12;">' + g.label + "</span>"
    );
  }

  function chapterBadgeHtml(m) {
    var s = statusById(m.status);
    var text = s.label;
    if (m.chaptersRead > 0) {
      text += " · " + m.chaptersRead + "гл";
    }
    return '<span class="mt-card-badge" style="background:' + s.color + 'cc;">' + text + "</span>";
  }

  /* ---------- view: library ---------- */
  function matchesQuery(m, q) {
    if (m.title.toLowerCase().indexOf(q) !== -1) return true;
    var alt = m.altTitles;
    if (!alt) return false;
    return Object.keys(alt).some(function (k) {
      return (alt[k] || "").toLowerCase().indexOf(q) !== -1;
    });
  }

  function sortedManhwas() {
    var arr = state.manhwas.slice();
    if (state.filterStatus !== "all") {
      arr = arr.filter(function (m) { return m.status === state.filterStatus; });
    }
    if (state.filterGenre !== "all") {
      arr = arr.filter(function (m) {
        return m.genres && m.genres.indexOf(state.filterGenre) !== -1;
      });
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

    var filters = [{ id: "all", label: "Все", color: "#8A8A9A" }].concat(STATUSES);
    var filterBtns = filters.map(function (f) {
      var active = state.filterStatus === f.id;
      return (
        '<button class="mt-filter-chip' + (active ? " active" : "") + '" data-filter="' + f.id +
        '" style="' + (active ?
          "background:" + f.color + ";color:#fff;border-color:" + f.color :
          "border-color:" + f.color + "45;color:" + f.color) + '">' + f.label + "</button>"
      );
    }).join("");

    var genreFilters = [{ id: "all", label: "Все жанры", color: "#8A8A9A" }].concat(GENRES);
    var genreFilterBtns = genreFilters.map(function (f) {
      var active = state.filterGenre === f.id;
      return (
        '<button class="mt-filter-chip' + (active ? " active" : "") + '" data-filter-genre="' + f.id +
        '" style="' + (active ?
          "background:" + f.color + ";color:#fff;border-color:" + f.color :
          "border-color:" + f.color + "45;color:" + f.color) + '">' + f.label + "</button>"
      );
    }).join("");

    var query = state.searchQuery || "";
    var clearBtn = query
      ? '<button class="mt-search-clear" id="search-clear-btn" aria-label="Очистить поиск">✕</button>'
      : "";

    return (
      '<div class="mt-header">' +
      '<div class="mt-title">МАНХВА<span class="accent">•</span>ТРЕКЕР</div>' +
      '<div class="mt-subrow">' +
      '<div class="mt-subtitle">Рисовка, сюжет, персонажи — раздельно</div>' +
      '<div class="mt-sort-group">' + btns + "</div>" +
      "</div>" +
      '<div class="mt-search-wrap">' +
      '<input class="mt-input mt-search-input" id="search-input" placeholder="Поиск по названию…" value="' +
      escapeHtml(query) + '" />' + clearBtn +
      "</div>" +
      '<div class="mt-filter-row">' + filterBtns + "</div>" +
      '<div class="mt-filter-row">' + genreFilterBtns + "</div>" +
      "</div>"
    );
  }

  function renderErrorBanner() {
    if (!state.error) return "";
    return '<div class="mt-error">' + escapeHtml(state.error) + "</div>";
  }

  function renderLibrary() {
    var html = renderHeader() + renderErrorBanner() + '<div class="mt-grid">';
    var list = sortedManhwas();

    if (list.length === 0 && !state.addingManhwa) {
      var noneAtAll = state.manhwas.length === 0;
      html += noneAtAll
        ? '<div class="mt-paper mt-empty"><div class="mt-empty-title">Пока пусто</div>' +
          '<div class="mt-empty-text">Добавь манхву — оценишь рисовку, сюжет, персонажей и всё остальное по отдельности.</div></div>'
        : '<div class="mt-paper mt-empty"><div class="mt-empty-title">Ничего не найдено</div>' +
          '<div class="mt-empty-text">Попробуй изменить поиск или фильтр.</div></div>';
    }

    list.forEach(function (m) {
      var avg = average(m.criteria);
      var t = typeById(m.type || "manhwa");
      var firstLetter = m.title.charAt(0).toUpperCase();

      var coverHtml;
      if (m.cover) {
        coverHtml = '<img src="' + escapeHtml(m.cover) + '" alt="" loading="lazy" onerror="this.style.display='none';this.parentElement.querySelector('.mt-card-cover-placeholder').style.display='flex';" />' +
          '<div class="mt-card-cover-placeholder" style="display:none">' + firstLetter + "</div>";
      } else {
        coverHtml = '<div class="mt-card-cover-placeholder">' + firstLetter + "</div>";
      }

      html +=
        '<div class="mt-card" data-card-id="' + m.id + '">' +
        '<div class="mt-card-cover" data-open-id="' + m.id + '">' +
        coverHtml +
        chapterBadgeHtml(m) +
        '<span class="mt-card-type-badge" style="background:' + t.color + 'cc;">' + t.label + '</span>' +
        '<button class="mt-card-bookmark" data-bookmark-id="' + m.id + '" aria-label="Закладка">' + bookmarkSvg() + '</button>' +
        '<button class="mt-card-delete' + (state.confirmDeleteId === m.id ? ' confirm' : '') + '" data-delete-id="' + m.id + '" aria-label="Удалить">' +
        (state.confirmDeleteId === m.id ? 'Точно?' : '✕') + '</button>' +
        '</div>' +
        '<div class="mt-card-info" data-open-id="' + m.id + '">' +
        '<div class="mt-card-title">' + escapeHtml(m.title) + '</div>' +
        '<div class="mt-card-score" style="color:' + scoreColor(avg) + '">' + (avg === null ? '—' : avg.toFixed(1)) + '</div>' +
        '</div>' +
        '</div>';
    });

    if (state.addingManhwa) {
      var typeBtns = TYPES.map(function (t) {
        var active = state.pendingType === t.id;
        return (
          '<button class="mt-type-choice' + (active ? " active" : "") + '" data-pick-type="' + t.id +
          '" style="' + (active ? "background:" + t.color + ";color:#fff;border-color:" + t.color :
            "border-color:" + t.color + "55;color:" + t.color) + '">' + t.label + "</button>"
        );
      }).join("");

      var genreBtns = GENRES.map(function (g) {
        var active = state.pendingGenres.indexOf(g.id) !== -1;
        return (
          '<button class="mt-genre-chip' + (active ? " active" : "") + '" data-pick-genre="' + g.id +
          '" style="' + (active ? "background:" + g.color + ";color:#fff;border-color:" + g.color :
            "border-color:" + g.color + "45;color:" + g.color) + '">' + g.label + "</button>"
        );
      }).join("");

      html +=
        '<div class="mt-paper" style="grid-column:1/-1;">' +
        '<input class="mt-input" id="new-title-input" placeholder="Название манхвы" value="' +
        escapeHtml(state.pendingTitleDraft) + '" />' +
        '<div class="mt-type-row">' + typeBtns + "</div>" +
        '<div style="margin-top:10px;font-size:11px;color:var(--text-muted);font-weight:600;">ЖАНРЫ</div>' +
        '<div class="mt-genre-row">' + genreBtns + "</div>" +
        '<div style="margin-top:10px;font-size:11px;color:var(--text-muted);font-weight:600;">ОБЛОЖКА (URL)</div>' +
        '<input class="mt-input" id="new-cover-input" placeholder="https://... или оставь пустым" value="' +
        escapeHtml(state.pendingCover) + '" />' +
        '<div style="margin-top:10px;font-size:11px;color:var(--text-muted);font-weight:600;">ПРОГРЕСС ГЛАВ</div>' +
        '<div class="mt-chapter-row">' +
        '<span class="mt-chapter-label">Прочитано</span>' +
        '<input type="number" class="mt-input mt-chapter-input" id="new-chapters-read" value="' + (state.pendingChaptersRead || 0) + '" min="0" />' +
        '<span class="mt-chapter-sep">/</span>' +
        '<input type="number" class="mt-input mt-chapter-input" id="new-chapters-total" value="' + (state.pendingChaptersTotal || 0) + '" min="0" />' +
        '<span class="mt-chapter-label">Всего</span>' +
        '</div>' +
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

  function renderGenresPanel(m, editable) {
    var html = '<div class="mt-paper">' +
      '<div class="mt-panel-title">ЖАНРЫ</div>';

    if (editable) {
      var genreBtns = GENRES.map(function (g) {
        var active = m.genres && m.genres.indexOf(g.id) !== -1;
        return (
          '<button class="mt-genre-chip' + (active ? " active" : "") + '" data-toggle-genre="' + g.id +
          '" style="' + (active ? "background:" + g.color + ";color:#fff;border-color:" + g.color :
            "border-color:" + g.color + "45;color:" + g.color) + '">' + g.label + "</button>"
        );
      }).join("");
      html += '<div class="mt-genre-row">' + genreBtns + '</div>';
    } else {
      if (m.genres && m.genres.length > 0) {
        html += '<div class="mt-genre-display">' + m.genres.map(genreTagHtml).join("") + '</div>';
      } else {
        html += '<div style="color:var(--text-faint);font-size:12px;">Жанры не указаны</div>';
      }
    }
    html += '</div>';
    return html;
  }

  function renderChaptersPanel(m, editable) {
    var html = '<div class="mt-paper">' +
      '<div class="mt-panel-title">ПРОГРЕСС</div>';

    if (editable) {
      html += '<div class="mt-chapter-row">' +
        '<span class="mt-chapter-label">Прочитано</span>' +
        '<input type="number" class="mt-input mt-chapter-input" id="chapters-read-input" value="' + (m.chaptersRead || 0) + '" min="0" />' +
        '<span class="mt-chapter-sep">/</span>' +
        '<input type="number" class="mt-input mt-chapter-input" id="chapters-total-input" value="' + (m.chaptersTotal || 0) + '" min="0" />' +
        '<span class="mt-chapter-label">Всего</span>' +
        '</div>';
    } else {
      html += '<div style="display:flex;align-items:center;gap:8px;">' +
        '<span style="font-family:'Space Mono',monospace;font-size:18px;font-weight:700;color:var(--text-primary);">' + (m.chaptersRead || 0) + '</span>' +
        '<span style="color:var(--text-faint);">/</span>' +
        '<span style="font-family:'Space Mono',monospace;font-size:14px;color:var(--text-muted);">' + (m.chaptersTotal || 0) + '</span>' +
        '<span style="font-size:11px;color:var(--text-muted);margin-left:4px;">глав</span>' +
        '</div>';
    }
    html += '</div>';
    return html;
  }

  function renderCoverPanel(m, editable) {
    var firstLetter = m.title.charAt(0).toUpperCase();
    var coverHtml;
    if (m.cover) {
      coverHtml = '<img src="' + escapeHtml(m.cover) + '" alt="" onerror="this.style.display='none';this.parentElement.querySelector('.mt-detail-cover-placeholder').style.display='flex';" />' +
        '<div class="mt-detail-cover-placeholder" style="display:none">' + firstLetter + "</div>";
    } else {
      coverHtml = '<div class="mt-detail-cover-placeholder">' + firstLetter + "</div>";
    }

    var html = '<div class="mt-detail-cover-wrap">' + coverHtml + '</div>';

    if (editable) {
      html += '<div class="mt-cover-input-row" style="margin-top:10px;">' +
        '<input class="mt-input" id="cover-url-input" placeholder="URL обложки" value="' + escapeHtml(m.cover || "") + '" />' +
        '<button class="mt-ghost-btn" id="save-cover-btn" style="flex-shrink:0;">OK</button>' +
        '</div>';
    }
    return html;
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
      renderCoverPanel(m, editable) +
      renderChaptersPanel(m, editable) +
      renderAltTitlesPanel(m) +
      renderGenresPanel(m, editable) +
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

  function aggregateGenres() {
    var map = {};
    state.manhwas.forEach(function (m) {
      var avg = average(m.criteria);
      if (avg === null) return;
      if (!m.genres) return;
      m.genres.forEach(function (gId) {
        if (!map[gId]) map[gId] = { sum: 0, count: 0, totalScore: 0 };
        map[gId].sum += avg;
        map[gId].count += 1;
      });
    });
    return Object.keys(map)
      .map(function (gId) {
        var g = genreById(gId);
        return {
          id: gId,
          name: g ? g.label : gId,
          color: g ? g.color : "#8880A0",
          avgScore: map[gId].sum / map[gId].count,
          count: map[gId].count
        };
      })
      .sort(function (a, b) { return b.avgScore - a.avgScore; });
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
      '<div class="mt-profile-title">ПРОФИЛЬ<span style="color:#E85D5D">.</span></div>' +
      '<div class="mt-profile-sub">Статистика по всей библиотеке</div>' +
      "</div>" + renderErrorBanner() +
      '<div class="mt-list" style="padding:6px 16px 110px;display:flex;flex-direction:column;gap:14px;">' +
      '<div class="mt-chip-row">' +
      '<div class="mt-chip"><div class="mt-chip-value">' + state.manhwas.length + '</div><div class="mt-chip-label">в списке</div></div>' +
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

    // genre stats
    var genreStats = aggregateGenres();
    if (genreStats.length > 0) {
      var maxScore = Math.max.apply(null, genreStats.map(function (g) { return g.avgScore; }));
      var genreBars = genreStats.slice(0, 10).map(function (g) {
        var pct = (g.avgScore / maxScore) * 100;
        return (
          '<div class="mt-genre-stat-row">' +
          '<span class="mt-genre-stat-name">' + escapeHtml(g.name) + "</span>" +
          '<div class="mt-genre-stat-bar-track"><div class="mt-genre-stat-bar-fill" style="width:' + pct +
          "%;background:" + g.color + ';"></div></div>' +
          '<span class="mt-genre-stat-value" style="color:' + g.color + '">' + g.avgScore.toFixed(1) + "</span>" +
          '<span class="mt-genre-stat-count">' + g.count + " шт</span>" +
          "</div>"
        );
      }).join("");
      html +=
        '<div class="mt-paper"><div class="mt-panel-title">ЛЮБИМЫЕ ЖАНРЫ</div>' +
        genreBars + "</div>";
    }

    var agg = aggregateCriteria();
    if (agg.length >= 3) {
      html +=
        '<div class="mt-paper mt-radar-panel" style="align-items:flex-start">' +
        '<div class="mt-panel-title">СРЕДНЕЕ ПО КРИТЕРИЯМ</div>' +
        '<div style="width:100%;display:flex;justify-content:center">' +
        radarSvg(agg, { fillColor: "#5B8DEF", dotColor: "#E8A838" }) + "</div></div>";
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
        '<div class="mt-paper"><div class="mt-panel-title" style="color:#4CD97B">ТОП ПО ОЦЕНКЕ</div>' +
        top.map(miniRowHtml).join("") + "</div>";
    }
    if (bottom.length > 0) {
      html +=
        '<div class="mt-paper"><div class="mt-panel-title" style="color:#E85D5D">АУТСАЙДЕРЫ</div>' +
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

    app.querySelectorAll("[data-filter-genre]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.filterGenre = btn.getAttribute("data-filter-genre");
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

    // delete manhwa
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

    // bookmark toggle
    app.querySelectorAll("[data-bookmark-id]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        // bookmark functionality - could be extended later
        btn.style.opacity = btn.style.opacity === "0.4" ? "1" : "0.4";
      });
    });

    // add manhwa flow
    var startAdd = document.getElementById("start-add-manhwa");
    if (startAdd) startAdd.addEventListener("click", function () {
      state.addingManhwa = true;
      state.pendingType = "manhwa";
      state.pendingTitleDraft = "";
      state.pendingGenres = [];
      state.pendingCover = "";
      state.pendingChaptersRead = 0;
      state.pendingChaptersTotal = 0;
      render();
      var inp = document.getElementById("new-title-input");
      if (inp) inp.focus();
    });

    var cancelAdd = document.getElementById("cancel-add-manhwa");
    if (cancelAdd) cancelAdd.addEventListener("click", function () {
      state.addingManhwa = false;
      state.pendingTitleDraft = "";
      state.pendingGenres = [];
      state.pendingCover = "";
      render();
    });

    app.querySelectorAll("[data-pick-type]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var draftInput = document.getElementById("new-title-input");
        state.pendingTitleDraft = draftInput ? draftInput.value : "";
        var coverInput = document.getElementById("new-cover-input");
        state.pendingCover = coverInput ? coverInput.value : "";
        var readInput = document.getElementById("new-chapters-read");
        state.pendingChaptersRead = readInput ? parseInt(readInput.value) || 0 : 0;
        var totalInput = document.getElementById("new-chapters-total");
        state.pendingChaptersTotal = totalInput ? parseInt(totalInput.value) || 0 : 0;
        state.pendingType = btn.getAttribute("data-pick-type");
        render();
        var inp = document.getElementById("new-title-input");
        if (inp) inp.focus();
      });
    });

    app.querySelectorAll("[data-pick-genre]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var gId = btn.getAttribute("data-pick-genre");
        var idx = state.pendingGenres.indexOf(gId);
        if (idx !== -1) {
          state.pendingGenres.splice(idx, 1);
        } else {
          state.pendingGenres.push(gId);
        }
        var draftInput = document.getElementById("new-title-input");
        state.pendingTitleDraft = draftInput ? draftInput.value : "";
        var coverInput = document.getElementById("new-cover-input");
        state.pendingCover = coverInput ? coverInput.value : "";
        var readInput = document.getElementById("new-chapters-read");
        state.pendingChaptersRead = readInput ? parseInt(readInput.value) || 0 : 0;
        var totalInput = document.getElementById("new-chapters-total");
        state.pendingChaptersTotal = totalInput ? parseInt(totalInput.value) || 0 : 0;
        render();
        var inp = document.getElementById("new-title-input");
        if (inp) inp.focus();
      });
    });

    var confirmAdd = document.getElementById("confirm-add-manhwa");
    var titleInput = document.getElementById("new-title-input");
    function submitNewManhwa() {
      var val = titleInput ? titleInput.value.trim() : "";
      if (!val) return;
      var coverInput = document.getElementById("new-cover-input");
      var cover = coverInput ? coverInput.value.trim() : "";
      var readInput = document.getElementById("new-chapters-read");
      var totalInput = document.getElementById("new-chapters-total");
      var chaptersRead = readInput ? parseInt(readInput.value) || 0 : 0;
      var chaptersTotal = totalInput ? parseInt(totalInput.value) || 0 : 0;
      state.manhwas.push(newManhwa(val, state.pendingType, state.pendingGenres.slice(), cover, chaptersRead, chaptersTotal));
      state.addingManhwa = false;
      state.pendingTitleDraft = "";
      state.pendingGenres = [];
      state.pendingCover = "";
      state.pendingChaptersRead = 0;
      state.pendingChaptersTotal = 0;
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
      render();
    });

    // criterion sliders
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

    app.querySelectorAll("[data-delete-crit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!selected) return;
        var critId = btn.getAttribute("data-delete-crit");
        selected.criteria = selected.criteria.filter(function (c) { return c.id !== critId; });
        save();
        render();
      });
    });

    // toggle genres in detail
    app.querySelectorAll("[data-toggle-genre]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!selected) return;
        var gId = btn.getAttribute("data-toggle-genre");
        if (!selected.genres) selected.genres = [];
        var idx = selected.genres.indexOf(gId);
        if (idx !== -1) {
          selected.genres.splice(idx, 1);
        } else {
          selected.genres.push(gId);
        }
        save();
        render();
      });
    });

    // chapters in detail
    var chaptersReadInput = document.getElementById("chapters-read-input");
    var chaptersTotalInput = document.getElementById("chapters-total-input");
    if (chaptersReadInput && selected) {
      chaptersReadInput.addEventListener("change", function () {
        selected.chaptersRead = parseInt(chaptersReadInput.value) || 0;
        save();
        render();
      });
    }
    if (chaptersTotalInput && selected) {
      chaptersTotalInput.addEventListener("change", function () {
        selected.chaptersTotal = parseInt(chaptersTotalInput.value) || 0;
        save();
        render();
      });
    }

    // cover url in detail
    var coverUrlInput = document.getElementById("cover-url-input");
    var saveCoverBtn = document.getElementById("save-cover-btn");
    if (saveCoverBtn && coverUrlInput && selected) {
      saveCoverBtn.addEventListener("click", function () {
        selected.cover = coverUrlInput.value.trim();
        save();
        render();
      });
    }

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
