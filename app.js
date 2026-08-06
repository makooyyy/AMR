(function () {
  "use strict";

  var STORAGE_KEY = "manhwa-tracker:data:v1";

  var DEFAULT_CRITERIA = ["Рисовка", "Сюжет", "Персонажи", "Динамика", "Атмосфера"];

  var STATUSES = [
    { id: "reading", label: "Читаю", color: "#22D3EE" },
    { id: "done", label: "Завершено", color: "#34D399" },
    { id: "dropped", label: "Дропнул", color: "#FF5C77" },
    { id: "plan", label: "В планах", color: "#FFB238" }
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


  var EMOTION_LABELS = [
    "Пожалел о каждой потраченной минуте",
    "Плохо, раздражало",
    "Средне, не жалею, но и не запомнил",
    "Хорошо, получил удовольствие",
    "Шедевр, буду перечитывать / помню спустя годы"
  ];

  var POSITIVE_TAGS = [
    "Сильный мейн-герой", "Неожиданные повороты", "Прекрасная химия между героями",
    "Уникальный сеттинг", "Отличная комедия", "Красивые боевые сцены",
    "Глубокий лор", "Короткие, но ёмкие главы"
  ];

  var NEGATIVE_TAGS = [
    "Затянуто", "Падение качества арта", "Нелогичные поступки героев",
    "Переизбыток клише", "Слабый финал", "Проблемы с переводом", "Слишком много филлера"
  ];

  var AWARD_LABELS = {
    overall: "Тайтл месяца",
    "Рисовка": "Лучшая рисовка",
    "Сюжет": "Лучший сюжет",
    "Персонажи": "Лучшие персонажи",
    "Динамика": "Лучшая динамика",
    "Атмосфера": "Лучшая атмосфера"
  };

  var MONTH_NAMES_GENITIVE = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"
  ];

  // type: "feature" (новое) | "update" (обновление) | "fix" (исправление)
  var CHANGELOG = [
    {
      version: "18",
      type: "feature",
      title: "Ежемесячные награды",
      items: [
        "1 числа подводятся итоги прошлого месяца: «Тайтл месяца» и лучшие по каждому критерию среди добавленных в этом месяце",
        "Награды победителей показываются прямо на карточке манхвы",
        "В профиле — сводка «Церемония» с итогами последнего завершённого месяца",
        "Дата добавления теперь сохраняется у каждого тайтла (у старых тайтлов восстановлена автоматически)"
      ]
    },
    {
      version: "17",
      type: "fix",
      title: "Карточки и упрощение оценки",
      items: [
        "Оценка на карточках снова цветная по значению (красный/жёлтый/зелёный), а не всегда жёлтая",
        "Убрано обрезание бейджа с оценкой на обложке",
        "Первое впечатление (звёзды) больше не блокирует оценку на 12 часов — сразу открывает полную шкалу критериев"
      ]
    },
    {
      version: "16",
      type: "update",
      title: "Редизайн интерфейса",
      items: [
        "Новая палитра: розовый акцент, янтарные оценки, голубой статус «Читаю»",
        "Карточки в сетке — название и тип под обложкой, компактный бейдж статуса",
        "Плавающая нижняя навигация с иконками",
        "Колокольчик с индикатором новых обновлений вместо часов, поиск теперь скрывается за иконкой",
        "Лёгкие анимации: появление карточек, пружинистые нажатия"
      ]
    },
    {
      version: "15",
      type: "feature",
      title: "Журнал обновлений",
      items: ["Кнопка со списком всех изменений приложения по версиям"]
    },
    {
      version: "14",
      type: "update",
      title: "Единая блокировка карточки",
      items: [
        "Теги, жанры, альт-названия и обложка теперь заполняются один раз и блокируются вместе с оценкой",
        "Кнопка «Изменить» перенесена в самый низ страницы манхвы",
        "Обложка теперь показывается баннером в самом верху карточки"
      ]
    },
    {
      version: "13",
      type: "feature",
      title: "Двухфазная оценка и теги",
      items: [
        "Быстрая эмоциональная оценка (1–5 звёзд) сразу после прочтения",
        "Полная шкала критериев открывается только через 12 часов — против импульсивных оценок",
        "Теги «Сильные / слабые стороны» — до 3 штук на тайтл",
        "В профиле — блок «Часто отмечаешь» по тегам"
      ]
    },
    {
      version: "12",
      type: "fix",
      title: "Прокрутка страницы",
      items: [
        "Страница больше не дёргается наверх при каждом действии — только при смене экрана"
      ]
    },
    {
      version: "11",
      type: "fix",
      title: "Равные карточки в сетке",
      items: [
        "Исправлена разная ширина/высота карточек из-за длинных слов в названиях"
      ]
    },
    {
      version: "10",
      type: "update",
      title: "Упрощение главного меню",
      items: [
        "Удаление манхвы теперь возможно только внутри её карточки",
        "Фильтр по жанрам спрятан за отдельной кнопкой",
        "Из фильтра статусов убрана лишняя кнопка «Все» — повторный тап по активному статусу сбрасывает фильтр"
      ]
    },
    {
      version: "9",
      type: "fix",
      title: "Плашка статуса",
      items: ["Статус-бейдж на обложке больше не наезжает на кнопку удаления"]
    },
    {
      version: "8",
      type: "fix",
      title: "Выравнивание карточек",
      items: ["Названия теперь всегда занимают место под 2 строки — карточки в ряду не съезжают"]
    },
    {
      version: "7",
      type: "update",
      title: "Порядок блоков карточки",
      items: ["Оценки теперь показываются сверху, жанры/названия/обложка — снизу"]
    },
    {
      version: "6",
      type: "feature",
      title: "Обложки и жанры",
      items: [
        "Обложка по ссылке (URL)",
        "Жанры с готовыми подсказками и своими вариантами",
        "Сетка карточек-постеров вместо списка",
        "Фильтр и поиск по жанрам"
      ]
    },
    {
      version: "5",
      type: "feature",
      title: "Защита данных и метаданные",
      items: [
        "Удаление манхвы теперь с подтверждением (два тапа)",
        "Альтернативные названия — английское / японское / русское",
        "Оценка ставится один раз, потом только просмотр, изменить — по кнопке"
      ]
    },
    {
      version: "4",
      type: "feature",
      title: "Типы и поиск",
      items: [
        "Тип тайтла: манхва / манга / маньхуа",
        "Поиск по названию",
        "Фильтр по статусу"
      ]
    },
    {
      version: "3",
      type: "feature",
      title: "Профиль",
      items: [
        "Вкладка «Профиль» со статистикой",
        "Разбивка по статусам, средняя оценка, топ и аутсайдеры",
        "Резервное копирование — сохранить/загрузить из файла"
      ]
    },
    {
      version: "2",
      type: "update",
      title: "Тёмная тема",
      items: ["Полный редизайн: тёмный фон, радар-диаграмма критериев вместо просто списка чисел"]
    },
    {
      version: "1",
      type: "feature",
      title: "Первая версия",
      items: ["Оценка манхвы по критериям: рисовка, сюжет, персонажи, динамика, атмосфера"]
    }
  ];

  var ICON_BELL =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>' +
    '<path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';

  var ICON_SEARCH =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/>' +
    '<line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';

  var ICON_BOOK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>' +
    '<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';

  var ICON_USER =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>' +
    '<circle cx="12" cy="7" r="4"/></svg>';

  var CHANGELOG_SEEN_KEY = "manhwa-tracker:changelog-seen:v1";

  var lastViewKey = null;

  var state = {
    manhwas: [],
    tab: "library",
    selectedId: null,
    sortMode: "recent",
    filterStatus: "all",
    filterGenre: "all",
    showGenreFilter: false,
    showChangelog: false,
    showSearch: false,
    changelogSeenVersion: null,
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

  // "legacy" — manhwa added before the emotion-pick system existed, skip straight to normal rating
  // "phase1" — needs the quick emotional pick first
  // "phase2" — emotion picked (or legacy), full criteria available
  function ratingPhase(m) {
    if (m.emotionRating === undefined) return "legacy";
    if (m.emotionRating === null) return "phase1";
    return "phase2";
  }

  // Legacy manhwa (added before createdAt existed) get their date backfilled from
  // the timestamp encoded in the tail of uid(): random36(8 chars) + Date.now().toString(36)
  function getCreatedAt(m) {
    if (typeof m.createdAt === "number") return m.createdAt;
    if (m.id && m.id.length > 8) {
      var ts = parseInt(m.id.slice(8), 36);
      if (!isNaN(ts) && ts > 1577836800000 && ts < Date.now() + 86400000) return ts;
    }
    return null;
  }

  function monthKeyOf(ts) {
    var d = new Date(ts);
    return d.getFullYear() + "-" + (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1);
  }

  function monthLabel(monthKey) {
    var parts = monthKey.split("-");
    var idx = parseInt(parts[1], 10) - 1;
    return MONTH_NAMES_GENITIVE[idx] + " " + parts[0];
  }

  function computeMonthAwards(monthKey) {
    var eligible = state.manhwas.filter(function (m) {
      if (!m.rated) return false;
      var ts = getCreatedAt(m);
      return ts !== null && monthKeyOf(ts) === monthKey;
    });
    if (!eligible.length) return null;

    var awards = [];
    var bestOverall = null;
    eligible.forEach(function (m) {
      var avg = average(m.criteria);
      if (avg !== null && (bestOverall === null || avg > bestOverall.score)) {
        bestOverall = { categoryKey: "overall", manhwa: m, score: avg };
      }
    });
    if (bestOverall) awards.push(bestOverall);

    DEFAULT_CRITERIA.forEach(function (critName) {
      var best = null;
      eligible.forEach(function (m) {
        var c = m.criteria.find(function (cc) { return cc.name === critName; });
        if (c && (best === null || c.score > best.score)) {
          best = { categoryKey: critName, manhwa: m, score: c.score };
        }
      });
      if (best) awards.push(best);
    });

    return { monthKey: monthKey, awards: awards };
  }

  function lastCompletedMonthKey() {
    var now = new Date();
    var d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return monthKeyOf(d.getTime());
  }

  function awardsForManhwa(m) {
    var ts = getCreatedAt(m);
    if (ts === null) return [];
    var mk = monthKeyOf(ts);
    if (mk >= monthKeyOf(Date.now())) return [];
    var result = computeMonthAwards(mk);
    if (!result) return [];
    return result.awards.filter(function (a) { return a.manhwa.id === m.id; });
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
      createdAt: Date.now(),
      emotionRating: null,
      emotionRatedAt: null,
      tags: [],
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
    try {
      state.changelogSeenVersion = window.localStorage.getItem(CHANGELOG_SEEN_KEY);
    } catch (e) {
      state.changelogSeenVersion = null;
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
    var fill = opts.fillColor || "#FFB238";
    var dot = opts.dotColor || "#FFB238";
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

  function changelogTypeMeta(type) {
    if (type === "feature") return { label: "НОВОЕ", color: "#34D399" };
    if (type === "fix") return { label: "ИСПРАВЛЕНИЕ", color: "#FF5C77" };
    return { label: "ОБНОВЛЕНИЕ", color: "#6C93FF" };
  }

  function renderChangelog() {
    var entries = CHANGELOG.map(function (entry) {
      var meta = changelogTypeMeta(entry.type);
      var items = entry.items.map(function (it) {
        return '<li>' + escapeHtml(it) + "</li>";
      }).join("");
      return (
        '<div class="mt-paper mt-changelog-entry">' +
        '<div class="mt-changelog-entry-head">' +
        '<span class="mt-changelog-badge" style="background:' + meta.color + '18;color:' + meta.color +
        ";border-color:" + meta.color + '">' + meta.label + "</span>" +
        '<span class="mt-changelog-version">v' + escapeHtml(entry.version) + "</span>" +
        "</div>" +
        '<div class="mt-changelog-title">' + escapeHtml(entry.title) + "</div>" +
        '<ul class="mt-changelog-list">' + items + "</ul>" +
        "</div>"
      );
    }).join("");

    return (
      '<div class="mt-detail-head">' +
      '<button class="mt-icon-btn on-dark" id="changelog-back-btn" aria-label="Назад">←</button>' +
      '<div class="mt-detail-title">ЖУРНАЛ ОБНОВЛЕНИЙ</div>' +
      "</div>" +
      '<div class="mt-list">' + entries + "</div>"
    );
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

    var filterBtns = STATUSES.map(function (f) {
      var active = state.filterStatus === f.id;
      return (
        '<button class="mt-filter-chip' + (active ? " active" : "") + '" data-filter="' + f.id +
        '" style="' + (active ?
          "background:" + f.color + ";color:#0D0A14;border-color:" + f.color :
          "border-color:" + f.color + "45;color:" + f.color) + '">' + f.label + "</button>"
      );
    }).join("");

    var query = state.searchQuery || "";
    var clearBtn = query
      ? '<button class="mt-search-clear" id="search-clear-btn" aria-label="Очистить поиск">✕</button>'
      : "";

    var genreList = allGenresSorted();
    var genreToggleLabel = "Жанры" + (state.filterGenre !== "all" ? ": " + state.filterGenre : "");
    var genrePanel = "";
    if (genreList.length > 0 && state.showGenreFilter) {
      var genreChips = [{ id: "all", label: "Все жанры" }]
        .concat(genreList.map(function (g) { return { id: g, label: g }; }))
        .map(function (g) {
          var active = state.filterGenre === g.id;
          return (
            '<button class="mt-genre-filter-chip' + (active ? " active" : "") + '" data-genre-filter="' +
            escapeHtml(g.id) + '">' + escapeHtml(g.label) + "</button>"
          );
        }).join("");
      genrePanel = '<div class="mt-genre-filter-row">' + genreChips + "</div>";
    }

    var hasUnseen = CHANGELOG.length > 0 && CHANGELOG[0].version !== state.changelogSeenVersion;
    var searchPanel = state.showSearch
      ? '<div class="mt-search-wrap">' +
        '<input class="mt-input mt-search-input" id="search-input" placeholder="Поиск по названию или жанру…" value="' +
        escapeHtml(query) + '" />' + clearBtn +
        "</div>"
      : "";

    return (
      '<div class="mt-header">' +
      '<div class="mt-title-row">' +
      '<div class="mt-title">МАНХВА<span class="accent">•</span>ТРЕКЕР</div>' +
      '<button class="mt-icon-round" id="open-changelog" aria-label="Журнал обновлений">' + ICON_BELL +
      (hasUnseen ? '<span class="mt-notify-dot"></span>' : "") + "</button>" +
      "</div>" +
      '<div class="mt-subrow">' +
      '<div class="mt-subtitle">Рисовка, сюжет, персонажи — раздельно</div>' +
      '<div class="mt-subrow-actions">' +
      '<div class="mt-sort-group">' + btns + "</div>" +
      '<button class="mt-icon-round mt-icon-round-sm' + (state.showSearch ? " active" : "") +
      '" id="toggle-search" aria-label="Поиск">' + ICON_SEARCH + "</button>" +
      "</div></div>" +
      searchPanel +
      '<div class="mt-filter-row">' + filterBtns +
      (genreList.length > 0
        ? '<button class="mt-genre-toggle-chip' + (state.showGenreFilter ? " active" : "") +
          '" id="genre-filter-toggle">' + genreToggleLabel + "</button>"
        : "") +
      "</div>" +
      genrePanel +
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
      list.forEach(function (m, gridIdx) {
        var avg = average(m.criteria);
        var st = statusById(m.status);
        var ty = typeById(m.type || "manhwa");
        var coverStyle = m.coverUrl
          ? "background-image:url('" + escapeHtml(m.coverUrl).replace(/'/g, "%27") + "')"
          : "";

        html +=
          '<div class="mt-grid-card" style="animation-delay:' + Math.min(gridIdx * 30, 240) + 'ms">' +
          '<div class="mt-cover' + (m.coverUrl ? "" : " mt-cover-empty") + '" style="' + coverStyle +
          '" data-open-id="' + m.id + '">' +
          (m.coverUrl ? "" : '<span class="mt-cover-fallback">' + escapeHtml((m.title[0] || "?").toUpperCase()) + "</span>") +
          '<span class="mt-cover-status" style="background:' + st.color + '">' + st.label + "</span>" +
          (awardsForManhwa(m).length > 0 ? '<span class="mt-cover-trophy">🏆</span>' : "") +
          '<span class="mt-cover-score" style="border-color:' + scoreColor(avg) + ";color:" + scoreColor(avg) +
          '">' + (avg === null ? "–" : avg.toFixed(1)) + "</span>" +
          "</div>" +
          '<div class="mt-cover-title" data-open-id="' + m.id + '">' + escapeHtml(m.title) + "</div>" +
          '<div class="mt-cover-type-line">' + ty.label + "</div>" +
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

  function renderRatingSection(m, avg, editable) {
    var phase = ratingPhase(m);

    if (phase === "phase1") {
      var stars = "";
      for (var i = 1; i <= 5; i++) {
        stars += '<button class="mt-emotion-star" data-emotion-pick="' + i +
          '" data-manhwa-id="' + m.id + '" aria-label="' + i + ' звёзд">★</button>';
      }
      return (
        '<div class="mt-paper mt-emotion-panel">' +
        '<div class="mt-panel-title">ПЕРВОЕ ВПЕЧАТЛЕНИЕ</div>' +
        '<div class="mt-emotion-hint">Оцени по горячим следам, сразу после прочтения — это только эмоция и на числовой рейтинг не повлияет.</div>' +
        '<div class="mt-emotion-stars">' + stars + "</div>" +
        "</div>"
      );
    }

    // phase === "legacy" or "phase2" — full criteria available
    var emotionRecap = "";
    if (typeof m.emotionRating === "number") {
      var recapStars = "";
      for (var j = 1; j <= 5; j++) {
        recapStars += '<span class="mt-emotion-star-static mini' + (j <= m.emotionRating ? " filled" : "") + '">★</span>';
      }
      emotionRecap =
        '<div class="mt-emotion-recap">' + recapStars +
        '<span class="mt-emotion-recap-label">' + escapeHtml(EMOTION_LABELS[m.emotionRating - 1]) + "</span></div>";
    }

    var html = '<div class="mt-paper mt-radar-panel">' + radarSvg(m.criteria, {}) + stampHtml(avg, 50) +
      emotionRecap + "</div>" +
      '<div class="mt-paper mt-criteria-panel">';

    if (editable) {
      html += '<div class="mt-lock-hint">Можно менять — не забудь нажать «Готово» внизу</div>';
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
    }

    return html;
  }

  function renderTagsPanel(m) {
    var tags = m.tags || [];
    var atLimit = tags.length >= 3;

    function chip(label, positive) {
      var selected = tags.indexOf(label) !== -1;
      var disabled = !selected && atLimit;
      var color = positive ? "#34D399" : "#FF5C77";
      var style = selected
        ? "background:" + color + ";color:#120F1A;border-color:" + color
        : disabled
        ? "border-color:rgba(255,255,255,0.08);color:var(--text-faint);opacity:0.5"
        : "border-color:" + color + "55;color:" + color;
      return (
        '<button class="mt-tag-chip"' + (disabled ? " disabled" : "") + ' data-toggle-tag="' +
        escapeHtml(label) + '" data-manhwa-id="' + m.id + '" style="' + style + '">' +
        (selected ? "✓ " : "") + escapeHtml(label) + "</button>"
      );
    }

    var posChips = POSITIVE_TAGS.map(function (t) { return chip(t, true); }).join("");
    var negChips = NEGATIVE_TAGS.map(function (t) { return chip(t, false); }).join("");

    return (
      '<div class="mt-paper">' +
      '<div class="mt-panel-title">СИЛЬНЫЕ / СЛАБЫЕ СТОРОНЫ</div>' +
      '<div class="mt-tag-hint">До 3 тегов, которые лучше всего описывают тайтл' +
      (atLimit ? " — лимит достигнут, сними один, чтобы выбрать другой" : "") + "</div>" +
      '<div class="mt-tag-group-label mt-tag-group-pos">Сильные стороны</div>' +
      '<div class="mt-tag-row">' + posChips + "</div>" +
      '<div class="mt-tag-group-label mt-tag-group-neg">Слабые стороны</div>' +
      '<div class="mt-tag-row">' + negChips + "</div>" +
      "</div>"
    );
  }

  function renderTagsReadOnly(m) {
    var tags = m.tags || [];
    if (!tags.length) return "";
    var chips = tags.map(function (t) {
      var positive = POSITIVE_TAGS.indexOf(t) !== -1;
      var color = positive ? "#34D399" : "#FF5C77";
      return '<span class="mt-tag-chip" style="border-color:' + color + ";color:" + color +
        ";background:" + color + '18;">' + escapeHtml(t) + "</span>";
    }).join("");
    return (
      '<div class="mt-paper">' +
      '<div class="mt-panel-title">СИЛЬНЫЕ / СЛАБЫЕ СТОРОНЫ</div>' +
      '<div class="mt-tag-row">' + chips + "</div>" +
      "</div>"
    );
  }

  function renderGenresReadOnly(m) {
    var genres = m.genres || [];
    if (!genres.length) return "";
    var chips = genres.map(function (g) {
      return '<span class="mt-genre-chip mt-genre-chip-static">' + escapeHtml(g) + "</span>";
    }).join("");
    return (
      '<div class="mt-paper">' +
      '<div class="mt-panel-title">ЖАНРЫ</div>' +
      '<div class="mt-genre-list">' + chips + "</div>" +
      "</div>"
    );
  }

  function renderAltTitlesReadOnly(m) {
    var alt = m.altTitles || {};
    var fields = [
      ["en", "EN"], ["ja", "JP"], ["ru", "RU"]
    ];
    var rows = fields
      .filter(function (f) { return alt[f[0]] && alt[f[0]].trim(); })
      .map(function (f) {
        return (
          '<div class="mt-alt-row-static"><span class="mt-alt-label">' + f[1] + "</span>" +
          '<span class="mt-alt-value">' + escapeHtml(alt[f[0]]) + "</span></div>"
        );
      }).join("");
    if (!rows) return "";
    return (
      '<div class="mt-paper">' +
      '<div class="mt-panel-title">АЛЬТЕРНАТИВНЫЕ НАЗВАНИЯ</div>' +
      rows +
      "</div>"
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
      '<div class="mt-detail-body">';

    if (m.coverUrl) {
      html += '<div class="mt-hero-cover" style="background-image:url(\'' +
        escapeHtml(m.coverUrl).replace(/'/g, "%27") + "')\"></div>";
    }

    var wins = awardsForManhwa(m);
    if (wins.length > 0) {
      html +=
        '<div class="mt-paper mt-award-panel">' +
        wins.map(function (a) {
          return (
            '<div class="mt-award-row">' +
            '<span class="mt-award-trophy">🏆</span>' +
            '<div><div class="mt-award-title">' + escapeHtml(AWARD_LABELS[a.categoryKey] || a.categoryKey) + "</div>" +
            '<div class="mt-award-sub">' + escapeHtml(monthLabel(monthKeyOf(getCreatedAt(m)))) + "</div></div>" +
            "</div>"
          );
        }).join("") +
        "</div>";
    }

    html += renderRatingSection(m, avg, editable);

    if (editable) {
      html += renderTagsPanel(m) + renderGenresPanel(m) + renderAltTitlesPanel(m) + renderCoverPanel(m);
    } else {
      html += renderTagsReadOnly(m) + renderGenresReadOnly(m) + renderAltTitlesReadOnly(m);
    }

    if (editable) {
      html += '<button class="mt-primary-btn" id="finish-rating-btn" data-manhwa-id="' + m.id +
        '" style="width:100%">Готово</button>';
    } else {
      html += '<button class="mt-ghost-btn" id="unlock-rating-btn" data-manhwa-id="' + m.id +
        '" style="width:100%">✎ Изменить</button>';
    }

    var confirmingDelete = state.confirmDeleteId === m.id;
    html += '<button class="mt-clear-btn' + (confirmingDelete ? " confirm" : "") +
      '" data-delete-id="' + m.id + '" style="width:100%">' +
      (confirmingDelete ? "Точно удалить? Нажми ещё раз" : "Удалить манхву") + "</button>";

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
      '<span class="mt-mini-score" style="color:#FFB238">' +
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
      '<div class="mt-profile-avatar">' + ICON_USER + "</div>" +
      '<div><div class="mt-profile-title">ПРОФИЛЬ<span style="color:#FF3D9A">.</span></div>' +
      '<div class="mt-profile-sub">Статистика по всей библиотеке</div></div>' +
      "</div>" + renderErrorBanner() +
      '<div class="mt-list">' +
      '<div class="mt-chip-row">' +
      '<div class="mt-chip"><div class="mt-chip-value">' + state.manhwas.length + '</div><div class="mt-chip-label">манхв в списке</div></div>' +
      '<div class="mt-chip"><div class="mt-chip-value" style="color:#FFB238">' +
      (overallAvg === null ? "—" : overallAvg.toFixed(1)) + '</div><div class="mt-chip-label">средняя оценка</div></div>' +
      "</div>";

    var ceremonyMonth = lastCompletedMonthKey();
    var ceremony = computeMonthAwards(ceremonyMonth);
    if (ceremony) {
      html +=
        '<div class="mt-paper mt-ceremony-panel">' +
        '<div class="mt-panel-title">🏆 Церемония — ' + escapeHtml(monthLabel(ceremonyMonth)) + "</div>" +
        ceremony.awards.map(function (a) {
          return (
            '<div class="mt-award-row" data-open-id="' + a.manhwa.id + '">' +
            '<span class="mt-award-trophy">🏆</span>' +
            '<div class="mt-award-info"><div class="mt-award-title">' +
            escapeHtml(AWARD_LABELS[a.categoryKey] || a.categoryKey) + "</div>" +
            '<div class="mt-award-sub">' + escapeHtml(a.manhwa.title) + "</div></div>" +
            '<span class="mt-award-score">' + a.score.toFixed(1) + "</span>" +
            "</div>"
          );
        }).join("") +
        "</div>";
    }

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
        radarSvg(agg, { fillColor: "#FFB238", dotColor: "#FFB238" }) + "</div></div>";
    }

    if (agg.length > 0) {
      var bars = agg.slice().sort(function (a, b) { return b.score - a.score; }).map(function (c) {
        return (
          '<div class="mt-bar-row"><span class="mt-bar-name">' + escapeHtml(c.name) + "</span>" +
          '<div class="mt-bar-track"><div class="mt-bar-fill" style="width:' + (c.score / 10) * 100 +
          '%;background:#FFB238;"></div></div>' +
          '<span class="mt-bar-value" style="color:#FFB238">' + c.score.toFixed(1) + "</span></div>"
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

    var tagCounts = {};
    state.manhwas.forEach(function (m) {
      (m.tags || []).forEach(function (t) { tagCounts[t] = (tagCounts[t] || 0) + 1; });
    });
    var topPos = POSITIVE_TAGS
      .filter(function (t) { return tagCounts[t]; })
      .sort(function (a, b) { return tagCounts[b] - tagCounts[a]; })
      .slice(0, 5);
    var topNeg = NEGATIVE_TAGS
      .filter(function (t) { return tagCounts[t]; })
      .sort(function (a, b) { return tagCounts[b] - tagCounts[a]; })
      .slice(0, 5);

    if (topPos.length > 0 || topNeg.length > 0) {
      var tagRow = function (t) {
        return '<span class="mt-tag-stat">' + escapeHtml(t) + ' <b>' + tagCounts[t] + "</b></span>";
      };
      html +=
        '<div class="mt-paper"><div class="mt-panel-title">ЧАСТО ОТМЕЧАЕШЬ</div>' +
        (topPos.length
          ? '<div class="mt-tag-group-label mt-tag-group-pos">Сильные стороны</div><div class="mt-tag-stat-row">' +
            topPos.map(tagRow).join("") + "</div>"
          : "") +
        (topNeg.length
          ? '<div class="mt-tag-group-label mt-tag-group-neg" style="margin-top:10px">Слабые стороны</div><div class="mt-tag-stat-row">' +
            topNeg.map(tagRow).join("") + "</div>"
          : "") +
        "</div>";
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
    var tabs = [
      ["library", "Библиотека", ICON_BOOK],
      ["profile", "Профиль", ICON_USER]
    ];
    var inner = tabs.map(function (t) {
      var active = state.tab === t[0];
      return (
        '<button class="mt-tab-v2' + (active ? " active" : "") + '" data-tab="' + t[0] + '">' +
        '<span class="mt-tab-icon-wrap">' + t[2] + "</span>" +
        '<span class="mt-tab-label">' + t[1] + "</span>" +
        "</button>"
      );
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
    if (state.showChangelog) {
      body = renderChangelog();
    } else if (selected) {
      body = renderDetail(selected);
    } else if (state.tab === "library") {
      body = renderLibrary();
    } else {
      body = renderProfile();
    }

    var showTabs = !selected && !state.showChangelog;
    app.innerHTML = '<div class="mt-shell">' + body + "</div>" + (showTabs ? renderTabbar() : "");
    attachHandlers(selected);

    var viewKey = state.showChangelog ? "changelog" : (selected ? "detail:" + selected.id : "tab:" + state.tab);
    var viewChanged = viewKey !== lastViewKey;
    lastViewKey = viewKey;

    if (focusInfo) {
      var el = document.getElementById("search-input");
      if (el) {
        el.focus();
        try { el.setSelectionRange(focusInfo.start, focusInfo.end); } catch (e) {}
      }
    } else if (viewChanged) {
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
        var id = btn.getAttribute("data-filter");
        state.filterStatus = state.filterStatus === id ? "all" : id;
        render();
      });
    });

    var genreToggle = document.getElementById("genre-filter-toggle");
    if (genreToggle) genreToggle.addEventListener("click", function () {
      state.showGenreFilter = !state.showGenreFilter;
      render();
    });

    app.querySelectorAll("[data-genre-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.filterGenre = btn.getAttribute("data-genre-filter");
        state.showGenreFilter = false;
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

    var toggleSearchBtn = document.getElementById("toggle-search");
    if (toggleSearchBtn) toggleSearchBtn.addEventListener("click", function () {
      state.showSearch = !state.showSearch;
      if (!state.showSearch) state.searchQuery = "";
      render();
      if (state.showSearch) {
        var el = document.getElementById("search-input");
        if (el) el.focus();
      }
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

    var openChangelogBtn = document.getElementById("open-changelog");
    if (openChangelogBtn) openChangelogBtn.addEventListener("click", function () {
      state.showChangelog = true;
      if (CHANGELOG.length > 0) {
        state.changelogSeenVersion = CHANGELOG[0].version;
        try { window.localStorage.setItem(CHANGELOG_SEEN_KEY, CHANGELOG[0].version); } catch (e) {}
      }
      render();
    });

    var changelogBackBtn = document.getElementById("changelog-back-btn");
    if (changelogBackBtn) changelogBackBtn.addEventListener("click", function () {
      state.showChangelog = false;
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

    app.querySelectorAll("[data-emotion-pick]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-manhwa-id");
        var m = findManhwa(id);
        if (!m) return;
        m.emotionRating = parseInt(btn.getAttribute("data-emotion-pick"), 10);
        m.emotionRatedAt = Date.now();
        save();
        render();
      });
    });

    app.querySelectorAll("[data-toggle-tag]").forEach(function (btn) {
      if (btn.hasAttribute("disabled")) return;
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-manhwa-id");
        var m = findManhwa(id);
        if (!m) return;
        var tag = btn.getAttribute("data-toggle-tag");
        if (!m.tags) m.tags = [];
        var idx = m.tags.indexOf(tag);
        if (idx !== -1) {
          m.tags.splice(idx, 1);
        } else if (m.tags.length < 3) {
          m.tags.push(tag);
        }
        save();
        render();
      });
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
      var json = JSON.stringify(state.manhwas, null, 2);
      var date = new Date().toISOString().slice(0, 10);
      var filename = "manhwa-tracker-backup-" + date + ".json";

      if (window.AndroidBridge && window.AndroidBridge.saveFile) {
        window.AndroidBridge.saveFile(filename, json);
        return;
      }

      var blob = new Blob([json], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = filename;
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
