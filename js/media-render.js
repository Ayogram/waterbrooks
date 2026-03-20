(function () {
  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  async function fetchMedia() {
    try {
      const res = await fetch('/api/media');
      const data = await res.json();
      return data.sort((a, b) => b.date.localeCompare(a.date)); // newest first
    } catch(err) {
      console.warn('Failed to fetch media API', err);
      return [];
    }
  }

  function renderMedia(mediaData) {
    // We assume the mount point is the same container in media.html 
    // replacing the pastorList id with mediaList id
    const mount = document.getElementById("mediaList");
    if (!mount) return;

    if (!mediaData.length) {
      mount.innerHTML = `
        <div class="pw-list-empty">
          <p>No media uploaded yet. Please check back soon.</p>
        </div>
      `;
      return;
    }

    const html = mediaData.map(m => {
      let mediaElement = '';
      if (m.type === 'video') {
        mediaElement = `<video controls src="${m.url}" style="width: 100%; border-radius: 8px;"></video>`;
      } else {
        mediaElement = `<img src="${m.url}" alt="${m.caption}" style="width: 100%; border-radius: 8px;" />`;
      }

      return `
        <article class="pw-post" style="padding: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 24px; border-radius: 8px; background: #fff;">
          <div style="margin-bottom: 16px;">
            ${mediaElement}
          </div>
          <div class="pw-post-date">${formatDate(m.date)}</div>
          <p style="font-size: 1.1rem; font-weight: 500; margin-top: 8px;">${m.caption}</p>
        </article>
      `;
    }).join("");

    mount.innerHTML = `<div class="pw-list-stack" style="display: grid; gap: 24px;">${html}</div>`;
  }

  document.addEventListener("DOMContentLoaded", async function () {
    const media = await fetchMedia();
    renderMedia(media);
  });
})();
