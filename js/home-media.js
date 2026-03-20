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
      return data.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8); // top 8 newest for slider
    } catch(err) {
      console.warn('Failed to fetch media API for home page', err);
      return [];
    }
  }

  function renderHomeMedia(mediaData) {
    const mount = document.getElementById("homeMediaPreview");
    if (!mount) return;

    if (!mediaData.length) {
      mount.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
          <p style="opacity: 0.7; font-size: 1.1rem;">No media available yet. Check back soon!</p>
        </div>
      `;
      return;
    }

    // Wrap the grid in a slider container for horizontal scrolling
    mount.style.display = 'block'; // override grid
    mount.innerHTML = `<div class="media-slider-container" style="display: flex; overflow-x: auto; gap: 2rem; padding-bottom: 2rem; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.2) transparent;"></div>`;
    const slider = mount.querySelector('.media-slider-container');

    const html = mediaData.map(m => {
      let mediaElement = '';
      
      const parseVideoLink = function(url) {
        if (!url) return null;
        let match;
        if ((match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i))) {
          return { platform: 'youtube', id: match[1], embedUrl: `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0`, thumbUrl: `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` };
        }
        return null;
      };

      if (m.type === 'link' || m.type === 'youtube') {
         const parsed = parseVideoLink(m.url);
         
         if (parsed && parsed.platform === 'youtube') {
           mediaElement = `
             <div class="yt-preview-wrapper" 
                  style="position:relative; width:100%; padding-bottom:56.25%; height:0; border-radius:12px; overflow:hidden; background:#000; cursor:pointer;"
                  onmouseenter="this.querySelector('.yt-iframe-placeholder').innerHTML = '<iframe width=\\'100%\\' height=\\'100%\\' src=\\'${parsed.embedUrl}\\' frameborder=\\'0\\' allow=\\'autoplay; encrypted-media; picture-in-picture\\' allowfullscreen style=\\'position:absolute; top:0; left:0; width:100%; height:100%; z-index:2;\\'></iframe>'; this.querySelector('.yt-thumb').style.opacity='0'; this.querySelector('.yt-watch-btn').style.opacity='1'; this.querySelector('.yt-play-icon').style.opacity='0';"
                  onmouseleave="this.querySelector('.yt-iframe-placeholder').innerHTML = ''; this.querySelector('.yt-thumb').style.opacity='1'; this.querySelector('.yt-watch-btn').style.opacity='0'; this.querySelector('.yt-play-icon').style.opacity='1';">
               
               <img class="yt-thumb" src="${parsed.thumbUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; transition: opacity 0.4s ease; z-index:1;" onerror="this.src='images/logo.png'">
               
               <div class="yt-iframe-placeholder" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:2;"></div>
               
               <!-- RELOCATED BUTTON: Bottom Right -->
               <a href="https://www.youtube.com/watch?v=${parsed.id}" target="_blank" class="yt-watch-btn" 
                  style="position:absolute; bottom:15px; right:15px; z-index:5; opacity:0; transition: all 0.3s ease; background:#fff; color:#011e3f; padding:8px 16px; border-radius:30px; font-weight:700; font-size:0.85rem; text-decoration:none; box-shadow:0 4px 15px rgba(0,0,0,0.4); display:flex; align-items:center; gap:6px;">
                 WATCH FULL <span style="font-size:1.2em;">→</span>
               </a>

               <div class="yt-play-icon" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); z-index:3; color:#fff; font-size:54px; pointer-events:none; transition: opacity 0.3s ease; text-shadow: 0 4px 15px rgba(0,0,0,0.6);">▶</div>
             </div>
           `;
         } else {
           mediaElement = `<a href="${m.url}" target="_blank" style="display:flex; height:200px; align-items:center; justify-content:center; background:rgba(255,255,255,0.1); color:#fff; border-radius:12px; border:1px solid rgba(255,255,255,0.2); text-decoration:none; font-weight:600;">Watch Live Video Stream</a>`;
         }
      } else if (m.type === 'video') {
        mediaElement = `<video controls src="${m.url}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px; background:#000;"></video>`;
      } else {
        mediaElement = `<img src="${m.url}" alt="${m.caption}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);" />`;
      }

      return `
        <article class="media-slider-item" style="flex: 0 0 350px; scroll-snap-align: start; display: flex; flex-direction: column; gap: 15px; transition: transform 0.3s ease;">
          ${mediaElement}
          <div style="padding: 0 5px;">
            <div style="font-size: 0.8rem; color: #a0aab8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; font-weight: 500;">${formatDate(m.date)}</div>
            <h3 style="font-size: 1.15rem; font-weight: 600; line-height: 1.4; margin: 0; color: #fff; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${m.caption}</h3>
          </div>
        </article>
      `;
    }).join("");

    slider.innerHTML = html;
  }

  document.addEventListener("DOMContentLoaded", async function () {
    const media = await fetchMedia();
    renderHomeMedia(media);
  });
})();
