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

  let cachedPosts = [];
  async function fetchPosts() {
    try {
      const res = await fetch('/api/posts');
      cachedPosts = await res.json();
    } catch(err) {
      console.warn('Failed to fetch posts from API, falling back', err);
      cachedPosts = Array.isArray(window.PASTOR_POSTS) ? window.PASTOR_POSTS : [];
    }
  }

  function getPosts() {
    const posts = cachedPosts.slice();
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
    // 1. Check pathname: /reflections/:id
    const pathMatch = window.location.pathname.match(/\/reflections\/([^/?#]+)/i);
    if (pathMatch && pathMatch[1]) {
      return decodeURIComponent(pathMatch[1]);
    }

    // 2. Check search params: ?open=ID or ?id=ID
    const params = new URLSearchParams(window.location.search);
    const open = params.get("open") || params.get("id");
    if (open) return open;

    // 3. Check hash: #reflection-ID or #ID
    const rawHash = (window.location.hash || "").replace("#", "");
    if (rawHash) {
      if (rawHash.startsWith("reflection-")) {
        return rawHash.replace("reflection-", "");
      }
      return rawHash;
    }

    return "";
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
              <span class="pill small-pill">Reflections</span>
              <h3 class="pw-empty-title">No reflections yet</h3>
              <p class="pw-empty-text">Please check back soon.</p>
              <a class="pw-viewall btn btn-primary" href="/pastor.html">View all</a>
            </div>
          </div>

          <div class="pw-feature-right">
            <div class="pw-pastor-photo">
              <img src="/images/pastor.jpg" alt="Apostle Niyi Aniya" />
              <div class="pw-pastor-name">Apostle Niyi Aniya</div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const itemsHtml = posts
      .map((p) => {
        const permalink = `/reflections/${encodeURIComponent(p.id)}`;
        const title = safeText(p.title);
        const excerpt = safeText(p.excerpt);
        const dateLabel = formatDate(p.date);

        return `
          <a class="pw-peek-item" href="${permalink}">
            <div class="pw-peek-meta">
              <span class="pill small-pill">Reflections</span>
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
            <a class="pw-viewall btn btn-primary" href="/pastor.html">View all</a>
          </div>
        </div>

        <div class="pw-feature-right">
          <div class="pw-pastor-photo">
            <img src="/images/pastor.jpg" alt="Apostle Niyi Aniya" />
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
          <p>No Reflections yet. Please check back soon.</p>
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

            let sectionCounter = 0;
            const bodyHtml = contentParas
              .filter(Boolean)
              .map((para, idx) => {
                const text = safeText(para);
                // Check if this paragraph is a distinct numbered point or heading
                const isSectionHeader = /^\s*(\d+[\.\)]|[•\-–—]\s+[A-Z]|[A-Z\s]{4,}:)/.test(text);
                let pId = `reflection-${encodeURIComponent(id)}-p-${idx + 1}`;
                if (isSectionHeader) {
                  sectionCounter++;
                  pId = `reflection-${encodeURIComponent(id)}-section-${sectionCounter}`;
                }
                return `<p id="${pId}">${text}</p>`;
              })
              .join("");

            return `
              <article class="pw-post" id="reflection-${encodeURIComponent(id)}" data-post="${id}">
                <div class="pw-post-top" data-toggle="${id}">
                  <div class="pw-post-left">
                    <div class="pw-post-date">${dateLabel}</div>
                    <div class="pw-post-title">${title}</div>
                    <div class="pw-post-excerpt">${excerpt}</div>
                  </div>

                  <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                    <button class="pw-copylink-btn" type="button" onclick="event.stopPropagation(); copyReflectionPermalink('${id}', this);" title="Copy link to this reflection">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                      </svg>
                      <span>Copy Link</span>
                    </button>
                    <button class="pw-readmore" type="button" data-toggle-btn="${id}">
                      Read more
                    </button>
                  </div>
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
      if (row && mount.contains(row) && !e.target.closest("button") && !e.target.closest("a")) {
        togglePost(row.getAttribute("data-toggle"));
      }
    });

    const openId = getOpenIdFromUrl();
    if (openId) {
      let id = openId;
      try {
        id = decodeURIComponent(openId);
      } catch (_) {}

      // Find post matching id or slug
      const matchedPost = posts.find(p => p.id === id || encodeURIComponent(p.id) === id);
      const actualId = matchedPost ? matchedPost.id : id;

      openPost(actualId);
      const card = mount.querySelector(`[data-post="${CSS.escape(actualId)}"]`);
      if (card) {
        scrollToPostTop(card);
        card.classList.add('pw-post-highlighted');
        setTimeout(() => {
          card.classList.remove('pw-post-highlighted');
        }, 3000);
      }

      if (matchedPost) {
        document.title = `Waterbrooks Reflections | ${matchedPost.title}`;
      }
    }
  }

  // Copy Reflection Permalink
  window.copyReflectionPermalink = function(postId, btn) {
    const permalink = `${window.location.origin}/reflections/${encodeURIComponent(postId)}`;
    const span = btn ? btn.querySelector('span') : null;

    function onCopied() {
      if (btn) btn.classList.add('copied');
      if (span) span.textContent = '✓ Copied!';
      showReflectionToast('Reflection link copied to clipboard!');
      setTimeout(() => {
        if (btn) btn.classList.remove('copied');
        if (span) span.textContent = 'Copy Link';
      }, 2500);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(permalink).then(onCopied).catch(() => fallbackCopy(permalink, onCopied));
    } else {
      fallbackCopy(permalink, onCopied);
    }
  };

  function fallbackCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      if (cb) cb();
    } catch(e) {}
    document.body.removeChild(ta);
  }

  function showReflectionToast(msg) {
    let toast = document.getElementById('reflectionToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'reflectionToast';
      toast.className = 'custom-toast';
      toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>${msg}</span>
      `;
      document.body.appendChild(toast);
    } else {
      toast.querySelector('span').textContent = msg;
    }

    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  document.addEventListener("DOMContentLoaded", async function () {
    await fetchPosts();
    renderSecondaryExposure();
    renderListPage();
  });
})();
