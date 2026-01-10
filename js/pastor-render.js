/* ================================
   js/pastor-render.js  (FIXED)
   - Home: attractive 2-column layout (3 sneak peeks + pastor picture)
   - Home "Read more" now goes to: pastor.html?open=POST_ID
   - Pastor page: toggle open/close inside same card
   ================================ */
(function () {
  function safeText(s) {
    return String(s ?? "");
  }

  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function getPosts() {
    const posts = Array.isArray(window.PASTOR_POSTS)
      ? window.PASTOR_POSTS.slice()
      : [];
    posts.sort((a, b) => safeText(b.date).localeCompare(safeText(a.date)));
    return posts;
  }

  function getHeaderOffset() {
    const header = document.querySelector(".header");
    const h = header ? header.getBoundingClientRect().height : 72;
    return Math.ceil(h + 16);
  }

  function scrollToPostTop(el) {
    if (!el) return;
    const y =
      el.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  function getOpenIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const open = params.get("open");
    if (open) return open;

    const hash = (window.location.hash || "").replace("#", "");
    if (hash) return hash;

    return "";
  }

  function clearHashIfPresent() {
    if (!window.location.hash) return;
    try {
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    } catch (_) {}
  }

  /* =========================
     HOME (index.html)
     ========================= */
  function renderSecondaryExposure() {
    const mount = document.getElementById("pastorSecondary");
    if (!mount) return;

    const posts = getPosts().slice(0, 3);

    if (!posts.length) {
      mount.innerHTML = `
        <div class="pw-feature">
          <div class="pw-feature-left">
            <div class="pw-peek-empty">
              <span class="pill small-pill">Pastor Words</span>
              <h3 class="pw-empty-title">No write-ups yet</h3>
              <p class="pw-empty-text">Please check back soon.</p>
              <a class="pw-viewall btn btn-primary" href="pastor.html">View all</a>
            </div>
          </div>

          <div class="pw-feature-right">
            <div class="pw-pastor-photo">
              <img src="images/pastor.jpg" alt="Apostle Niyi Aniya" />
              <div class="pw-pastor-name">Apostle Niyi Aniya</div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const itemsHtml = posts
      .map((p) => {
        const id = encodeURIComponent(p.id);
        const title = safeText(p.title);
        const excerpt = safeText(p.excerpt);
        const dateLabel = formatDate(p.date);

        return `
          <a class="pw-peek-item" href="pastor.html?open=${id}">
            <div class="pw-peek-meta">
              <span class="pill small-pill">Pastor Words</span>
              <span class="pw-peek-date">${dateLabel}</span>
            </div>
            <div class="pw-peek-title">${title}</div>
            <div class="pw-peek-excerpt">${excerpt}</div>
            <div class="pw-peek-cta">Read more →</div>
          </a>
        `;
      })
      .join("");

    mount.innerHTML = `
      <div class="pw-feature">
        <div class="pw-feature-left">
          <div class="pw-peek-list">
            ${itemsHtml}
          </div>

          <div class="pw-home-actions">
            <a class="pw-viewall btn btn-primary" href="pastor.html">View all</a>
          </div>
        </div>

        <div class="pw-feature-right">
          <div class="pw-pastor-photo">
            <img src="images/pastor.jpg" alt="Apostle Niyi Aniya" />
            <div class="pw-pastor-name">Apostle Niyi Aniya</div>
          </div>
        </div>
      </div>
    `;
  }

  /* =========================
     PASTOR PAGE (pastor.html)
     ========================= */
  function renderListPage() {
    const mount = document.getElementById("pastorList");
    if (!mount) return;

    const posts = getPosts();

    if (!posts.length) {
      mount.innerHTML = `
        <div class="pw-list-empty">
          <p>No write-ups yet. Please check back soon.</p>
        </div>
      `;
      return;
    }

    mount.innerHTML = `
      <div class="pw-list-stack">
        ${posts
          .map((p) => {
            const id = safeText(p.id);
            const title = safeText(p.title);
            const excerpt = safeText(p.excerpt);
            const dateLabel = formatDate(p.date);

            const contentParas = Array.isArray(p.content)
              ? p.content
              : [safeText(p.content)];

            const bodyHtml = contentParas
              .filter(Boolean)
              .map((para) => `<p>${safeText(para)}</p>`)
              .join("");

            return `
              <article class="pw-post" id="${encodeURIComponent(id)}" data-post="${id}">
                <div class="pw-post-top" data-toggle="${id}">
                  <div class="pw-post-left">
                    <div class="pw-post-date">${dateLabel}</div>
                    <div class="pw-post-title">${title}</div>
                    <div class="pw-post-excerpt">${excerpt}</div>
                  </div>

                  <button class="pw-readmore" type="button" data-toggle-btn="${id}">
                    Read more
                  </button>
                </div>

                <div class="pw-post-body" data-body="${id}">
                  ${bodyHtml}
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    `;

    function openPost(id) {
      const body = mount.querySelector(`[data-body="${CSS.escape(id)}"]`);
      const btn = mount.querySelector(`[data-toggle-btn="${CSS.escape(id)}"]`);
      if (!body || !btn) return;
      body.classList.add("is-open");
      btn.textContent = "Close";
    }

    function closePost(id) {
      const body = mount.querySelector(`[data-body="${CSS.escape(id)}"]`);
      const btn = mount.querySelector(`[data-toggle-btn="${CSS.escape(id)}"]`);
      if (!body || !btn) return;
      body.classList.remove("is-open");
      btn.textContent = "Read more";
    }

    function togglePost(id) {
      const body = mount.querySelector(`[data-body="${CSS.escape(id)}"]`);
      if (!body) return;
      body.classList.contains("is-open") ? closePost(id) : openPost(id);
    }

    mount.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-toggle-btn]");
      if (btn && mount.contains(btn)) {
        e.preventDefault();
        togglePost(btn.getAttribute("data-toggle-btn"));
        return;
      }

      const row = e.target.closest("[data-toggle]");
      if (row && mount.contains(row) && !e.target.closest("a")) {
        togglePost(row.getAttribute("data-toggle"));
      }
    });

    const openId = getOpenIdFromUrl();
    if (openId) {
      let id = openId;
      try {
        id = decodeURIComponent(openId);
      } catch (_) {}
      openPost(id);
      scrollToPostTop(mount.querySelector(`[data-post="${CSS.escape(id)}"]`));
      clearHashIfPresent();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderSecondaryExposure();
    renderListPage();
  });
})();
