# Индустриальный пояс — памятка для работы над игрой

Браузерная стратегия. Пользователь пишет по-русски — отвечать по-русски.

## Где что лежит

Чистые HTML/CSS/JS без сборки и без модулей: обычные `<script src>`, все объявления
глобальные и общие для всех файлов. **Порядок подключения важен**: `core.js` → `ui.js` →
`pages/*` → `main.js`. В файлах вкладок — только объявления функций и обработчики событий;
код, который выполняется сразу при загрузке, кладётся в `main.js`.

| Задача | Файлы |
|---|---|
| Вкладка 1 «Штаб» | `js/pages/1-hq.js`, `css/pages/1-hq.css` |
| Вкладка 2 «Здания» | `js/pages/2-buildings.js`, `css/pages/2-buildings.css` |
| Вкладка 3 «Стройка» | `js/pages/3-build.js`, `css/pages/3-build.css` |
| Вкладка 4 «Рабочие» | `js/pages/4-workers.js`, `css/pages/4-workers.css` |
| Вкладка 5 «Навыки» | `js/pages/5-skills.js`, `css/pages/5-skills.css` |
| Вкладка 6 «Цех» (производство) | `js/pages/6-production.js`, `css/pages/6-production.css` |
| Вкладка 7 «Склад» | `js/pages/7-warehouse.js`, `css/pages/7-warehouse.css` |
| Данные, правила, сохранение, симуляция, действия игрока (стройка/ремонт/снос/смена руды) | `js/core.js` |
| Хотбар, SVG-значки (`SECTION_ICONS`, `ICONS`, `RES48`, `TYPE48`, `UI20`), `renderAll`, `openSection`, анимация циклов `tickCycleBars` | `js/ui.js`, `css/hotbar.css` |
| Запуск, офлайн-прогресс, тестовое ускорение, таймеры | `js/main.js` |
| Цвета (`:root`), шрифты, материал `.bevel-frame` / `.bevel` / `.sunk` | `css/base.css` |
| Разметка каркаса | `index.html` |

Читай только нужные файлы, а не всё подряд.

## Правила

- `SAVE_KEY='industrial_belt_v19'` в `core.js` — менять только при несовместимом изменении
  формата сохранения, не ради визуальных правок.
- Панели перерисовываются каждую секунду (`renderAll`). DOM вкладки трогать только при реальных
  изменениях (сравнение ключа/HTML, правка на месте), иначе теряются клики и сбрасываются
  CSS-анимации. Прогресс циклов — через CSS-переменную `--p` (`data-cycle-unit`) и
  `tickCycleBars`, а не перерисовкой.
- Ресурсы на экране — химическими формулами (`resName`), полное название — во всплывающей
  подсказке (`resFullName`, `resTag`).
- Стиль — «игровой»: минимум текста, крупные значки 48×48, материал хотбара. Анимации
  отключаются при `prefers-reduced-motion`. Проверять ширину 390px (телефон) — без
  горизонтальной прокрутки.
- При крупных изменениях внешнего вида сначала показать пользователю несколько вариантов
  отдельной страницей-превью, потом переносить выбранный.

## Проверка

Playwright: `require('/opt/node22/lib/node_modules/playwright')`,
`chromium.launch({executablePath:'/opt/pw-browsers/chromium'})`, страница
`file:///home/user/game/index.html`. Функции игры глобальные — их можно вызывать из
`page.evaluate` (`tryBuild('iron_ore')`, `openSection('production')`, `state`…).
Проверить: 1200px и 390px, ноль `pageerror`. Ошибка загрузки Google Fonts через прокси — не баг.

## После каждого изменения

1. Раздел в `README.md` (история изменений, `##` на изменение).
2. Коммит в `master`, `git push -u origin master`.
3. Переопубликовать артефакт https://claude.ai/artifact/XsqehpqUZhkSwitmsVpoGF —
   `Artifact` publish с `url`, `file_path: index.html` и `files`, где перечислены все
   `css/**` и `js/**` (ключ = путь, значение = тот же путь).
