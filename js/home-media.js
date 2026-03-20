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
      return data.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3); // top 3 newest
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
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; background: rgba(255,255,255,0.05); border-radius: 8px;">
          <p style="opacity: 0.7;">No media available yet.</p>
        </div>
      `;
      return;
    }

    const html = mediaData.map(m => {
      let mediaElement = '';
      
      const parseVideoLink = function(url) {
        if (!url) return null;
        let match;
        if ((match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i))) {
          return { platform: 'youtube', id: match[1], embedUrl: `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`, thumbUrl: `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` };
        }
        if ((url.includes('facebook.com') || url.includes('fb.watch')) && (url.includes('/videos/') || url.includes('/watch') || url.includes('fb.watch'))) {
          return { platform: 'facebook', embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=500` };
        }
        if ((match = url.match(/instagram\.com\/(?:p|reel|tv)\/([^\/?#&]+)/i))) {
          return { platform: 'instagram', id: match[1], embedUrl: `https://www.instagram.com/p/${match[1]}/embed` };
        }
        return null;
      };

      if (m.type === 'link' || m.type === 'youtube') {
         const parsed = parseVideoLink(m.url);
         
         if (parsed && parsed.platform === 'youtube') {
           mediaElement = `
             <div class="yt-preview-wrapper" 
                  style="position:relative; width:100%; padding-bottom:56.25%; height:0; border-radius:8px; overflow:hidden; background:#000; cursor:pointer;"
                  onmouseenter="this.querySelector('.yt-iframe-placeholder').innerHTML = '<iframe width=\\'100%\\' height=\\'100%\\' src=\\'${parsed.embedUrl}\\' frameborder=\\'0\\' allow=\\'autoplay; encrypted-media\\' style=\\'position:absolute; top:0; left:0; width:100%; height:100%;\\'></iframe>'; this.querySelector('.yt-thumb').style.opacity='0'; this.querySelector('.yt-overlay-hint').style.display='flex';"
                  onmouseleave="this.querySelector('.yt-iframe-placeholder').innerHTML = ''; this.querySelector('.yt-thumb').style.opacity='1'; this.querySelector('.yt-overlay-hint').style.display='none';">
               <img class="yt-thumb" src="${parsed.thumbUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; transition: opacity 0.3s ease; z-index:1;" onerror="this.src='images/logo.png'">
               <div class="yt-iframe-placeholder" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:2;"></div>
               <a href="https://www.youtube.com/watch?v=${parsed.id}" target="_blank" class="yt-overlay-hint" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:4; display:none; align-items:center; justify-content:center; background:rgba(0,0,0,0.4); text-decoration:none; cursor:pointer;">
                 <div style="background:rgba(255,255,255,0.2); backdrop-filter:blur(4px); border:1px solid rgba(255,255,255,0.5); color:#fff; padding:10px 20px; border-radius:30px; font-weight:600; font-size:1em; box-shadow:0 4px 15px rgba(0,0,0,0.5); text-transform:uppercase; letter-spacing:1px; transform:translateY(20px);">Click to Watch →</div>
               </a>
               <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); z-index:3; color:#fff; font-size:48px; pointer-events:none; opacity:0.9; text-shadow: 0 4px 10px rgba(0,0,0,0.5);">▶</div>
             </div>
           `;
         } else if (parsed && parsed.platform === 'instagram') {
           mediaElement = `<div style="border-radius:8px; overflow:hidden; background:#fff;"><iframe style="width:100%; max-width:400px; height:400px; margin:0 auto; display:block;" src="${parsed.embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen scrolling="no"></iframe></div>`;
         } else if (parsed && parsed.platform === 'facebook') {
           mediaElement = `<div style="border-radius:8px; overflow:hidden; background:#fff;"><iframe style="width:100%; height:280px; overflow:hidden;" src="${parsed.embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen scrolling="no"></iframe></div>`;
         } else {
           mediaElement = `<a href="${m.url}" target="_blank" style="display:flex; height:200px; align-items:center; justify-content:center; background:rgba(255,255,255,0.1); color:#fff; border-radius:8px; border:1px solid rgba(255,255,255,0.2); text-decoration:none; font-weight:600;">Watch Live Video Stream</a>`;
         }
      } else if (m.type === 'video') {
        mediaElement = `<video controls src="${m.url}" style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px; background:#000;"></video>`;
      } else {
        mediaElement = `<img src="${m.url}" alt="${m.caption}" style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);" />`;
      }

      return `
        <article style="display: flex; flex-direction: column; gap: 12px; transition: transform 0.3s ease;" onmouseenter="this.style.transform='translateY(-5px)'" onmouseleave="this.style.transform='translateY(0)'">
          ${mediaElement}
          <div>
            <div style="font-size: 0.85rem; color: #a0aab8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${formatDate(m.date)}</div>
            <h3 style="font-size: 1.1rem; font-weight: 600; line-height: 1.4; margin: 0; color: #fff;">${m.caption}</h3>
          </div>
        </article>
      `;
    }).join("");

    mount.innerHTML = html;
  }

  document.addEventListener("DOMContentLoaded", async function () {
    const media = await fetchMedia();
    renderHomeMedia(media);
  });
})();
