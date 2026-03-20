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
      
      // Re-initialize parser inside this scope for public rendering
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
                  onmouseleave="this.querySelector('.yt-iframe-placeholder').innerHTML = ''; this.querySelector('.yt-thumb').style.opacity='1'; this.querySelector('.yt-overlay-hint').style.display='none';"
                  onclick="window.open('https://www.youtube.com/watch?v=${parsed.id}', '_blank')">
               <img class="yt-thumb" src="${parsed.thumbUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; transition: opacity 0.3s ease; z-index:1;" onerror="this.src='images/logo.png'">
               <div class="yt-iframe-placeholder" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:2;"></div>
               <div class="yt-overlay-hint" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:3; display:none; align-items:flex-end; justify-content:center; padding-bottom:20px; background:rgba(0,0,0,0.2); pointer-events:none;">
                 <div style="background:rgba(0,86,179,0.9); color:#fff; padding:8px 16px; border-radius:20px; font-weight:600; font-size:0.9em; box-shadow:0 4px 10px rgba(0,0,0,0.3);">Watch Full Sermon →</div>
               </div>
               <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); z-index:3; color:#fff; font-size:48px; pointer-events:none; opacity:0.8;">▶</div>
             </div>
           `;
         } else if (parsed && parsed.platform === 'instagram') {
           mediaElement = `<iframe style="width:100%; max-width:400px; height:450px; margin:0 auto; display:block;" src="${parsed.embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen scrolling="no"></iframe>`;
         } else if (parsed && parsed.platform === 'facebook') {
           mediaElement = `<iframe style="width:100%; height:280px; overflow:hidden;" src="${parsed.embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen scrolling="no"></iframe>`;
         } else {
           mediaElement = `<a href="${m.url}" target="_blank" style="display:inline-block; padding:10px 20px; background:#0056b3; color:#fff; border-radius:4px; text-decoration:none;">Watch Live Video Stream</a>`;
         }
      } else if (m.type === 'video') {
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
