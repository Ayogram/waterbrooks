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
      return data.sort((a, b) => {
        const dateCompare = (b.date || "").localeCompare(a.date || "");
        if (dateCompare !== 0) return dateCompare;
        return (b.id || "").localeCompare(a.id || "");
      }); 
    } catch(err) {
      console.warn('Failed to fetch media API', err);
      return [];
    }
  }

  function renderMedia(mediaData) {
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
      
      const parseMediaLink = function(url) {
        if (!url) return null;
        let match;
        
        // YouTube
        if ((match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i))) {
          const videoId = match[1];
          return { 
            platform: 'youtube', 
            id: videoId, 
            embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&enablejsapi=1&loop=1&playlist=${videoId}`, 
            thumbUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` 
          };
        }

        // Facebook Post
        if (url.includes('facebook.com') && (url.includes('/posts/') || url.includes('/p/') || url.includes('/share/p/') || url.includes('/permalink/'))) {
          return { 
            platform: 'facebook-post', 
            embedUrl: `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500` 
          };
        }

        // Facebook Video
        if ((url.includes('facebook.com') || url.includes('fb.watch')) && (url.includes('/videos/') || url.includes('/watch') || url.includes('fb.watch') || url.includes('/share/v/'))) {
          return { 
            platform: 'facebook', 
            embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=500` 
          };
        }

        // Instagram
        if ((match = url.match(/instagram\.com\/(?:p|reel|tv)\/([^\/?#&]+)/i))) {
          return { 
            platform: 'instagram', 
            id: match[1], 
            embedUrl: `https://www.instagram.com/p/${match[1]}/embed` 
          };
        }

        // Spotify
        if (url.includes('spotify.com')) {
          const spotifyMatch = url.match(/spotify\.com\/(track|album|playlist|artist|show|episode)\/([a-zA-Z0-9]+)/);
          if (spotifyMatch) {
            return { platform: 'spotify', embedUrl: `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}` };
          }
        }

        // SoundCloud
        if (url.includes('soundcloud.com')) {
          return { platform: 'soundcloud', embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true` };
        }

        // Twitter / X
        if (url.includes('twitter.com') || url.includes('x.com')) {
           return { platform: 'twitter', embedUrl: `https://twitframe.com/show?url=${encodeURIComponent(url)}` };
        }

        // Generic Images (Cloudinary, JPG, PNG, etc.)
        if (url.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) || url.includes('cloudinary.com')) {
          return { platform: 'image', embedUrl: url };
        }

        // Generic Videos (MP4, WebM, etc.)
        if (url.match(/\.(mp4|webm|ogg)($|\?)/i)) {
          return { platform: 'video', embedUrl: url };
        }

        return null;
      };

      const isVideoType = m.type === 'link' || m.type === 'youtube' || m.type === 'video';
      const videoPageUrl = `/media/video/${encodeURIComponent(m.id)}`;

      if (isVideoType) {
         const parsed = parseMediaLink(m.url);
         
         if (parsed && parsed.platform === 'youtube') {
           mediaElement = `
             <div class="yt-preview-wrapper" 
                  style="position:relative; width:100%; padding-bottom:56.25%; height:0; border-radius:12px; overflow:hidden; background:#000; cursor:pointer;"
                  onclick="window.location.href='${videoPageUrl}';"
                  onmouseenter="this.querySelector('.yt-iframe-placeholder').innerHTML = '<iframe width=\\'100%\\' height=\\'100%\\' src=\\'${parsed.embedUrl}\\' frameborder=\\'0\\' allow=\\'autoplay; encrypted-media; picture-in-picture\\' allowfullscreen style=\\'position:absolute; top:0; left:0; width:100%; height:100%; z-index:2;\\'></iframe>'; this.querySelector('.yt-thumb').style.opacity='0'; this.querySelector('.yt-overlay-hint').style.display='flex';"
                  onmouseleave="this.querySelector('.yt-iframe-placeholder').innerHTML = ''; this.querySelector('.yt-thumb').style.opacity='1'; this.querySelector('.yt-overlay-hint').style.display='none';">
               <img class="yt-thumb" src="${parsed.thumbUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; transition: opacity 0.4s ease; z-index:1;" onerror="this.src='/images/logo.png'">
               <div class="yt-iframe-placeholder" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:2;"></div>
               <div class="yt-overlay-hint" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:4; display:none; align-items:flex-end; justify-content:center; padding-bottom:20px; background:rgba(0,0,0,0.25); text-decoration:none;">
                 <span style="background:var(--primary, #306aa1); color:#fff; padding:9px 20px; border-radius:30px; font-weight:700; font-size:0.95em; box-shadow:0 4px 12px rgba(0,0,0,0.35);">Watch on Waterbrooks →</span>
               </div>
               <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); z-index:3; color:#fff; font-size:48px; pointer-events:none; opacity:0.9; text-shadow:0 4px 12px rgba(0,0,0,0.6);">▶</div>
             </div>
           `;
         } else if (parsed && ['facebook', 'facebook-post', 'instagram', 'spotify', 'soundcloud', 'twitter'].includes(parsed.platform)) {
           let height = '300px';
           if (parsed.platform === 'facebook-post') height = '350px';
           if (parsed.platform === 'twitter') height = '450px';
           if (parsed.platform === 'spotify') height = '160px';
           if (parsed.platform === 'soundcloud') height = '166px';

            mediaElement = `
              <div class="yt-preview-wrapper" style="position:relative; width:100%; height:${height}; border-radius:12px; overflow:hidden; background:#000; cursor:pointer;"
                   onclick="window.location.href='${videoPageUrl}';"
                   onmouseenter="this.querySelector('.yt-overlay-hint').style.display='flex';"
                   onmouseleave="this.querySelector('.yt-overlay-hint').style.display='none';">
                <iframe src="${parsed.embedUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:none; overflow:hidden;" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
                <div class="yt-overlay-hint" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:4; display:none; align-items:flex-end; justify-content:center; padding-bottom:20px; background:rgba(0,0,0,0.25); text-decoration:none;">
                 <span style="background:var(--primary, #306aa1); color:#fff; padding:9px 20px; border-radius:30px; font-weight:700; font-size:0.95em; box-shadow:0 4px 12px rgba(0,0,0,0.35);">Watch on Waterbrooks →</span>
                </div>
              </div>
            `;
         } else if (m.type === 'video' || (m.url && m.url.match(/\.(mp4|webm|ogg)($|\?)/i))) {
            const videoSrc = m.url.startsWith('http') || m.url.startsWith('/') ? m.url : '/' + m.url;
            mediaElement = `
              <div class="yt-preview-wrapper" style="position:relative; width:100%; height:320px; border-radius:12px; overflow:hidden; background:#000; cursor:pointer;"
                   onclick="window.location.href='${videoPageUrl}';">
                <video src="${videoSrc}" muted loop style="width:100%; height:100%; object-fit:contain;"></video>
                <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); z-index:3; color:#fff; font-size:48px; pointer-events:none; opacity:0.9;">▶</div>
              </div>
            `;
         } else {
           mediaElement = `
             <div style="padding:30px; background:var(--muted, #f0f4f7); border-radius:12px; text-align:center;">
               <a href="${videoPageUrl}" class="btn btn-primary" style="padding:12px 28px; border-radius:30px; text-decoration:none; font-weight:700;">Watch Video on Waterbrooks</a>
             </div>
           `;
         }
      } else {
        // Image format
        const imgSrc = m.url.startsWith('http') || m.url.startsWith('/') ? m.url : '/' + m.url;
        mediaElement = `<img src="${imgSrc}" alt="${m.caption ? m.caption.replace(/"/g, '&quot;') : 'Waterbrooks Media'}" style="width: 100%; max-height: 480px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); cursor: pointer;" onclick="window.open('${imgSrc}', '_blank');" onerror="this.src='/images/logo.png'" />`;
      }

      const actionsHtml = isVideoType ? `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px; pt-2; border-top:1px solid #edf2f7; padding-top:14px; flex-wrap:wrap; gap:10px;">
          <a href="${videoPageUrl}" class="btn btn-primary" style="display:inline-flex; align-items:center; gap:6px; padding:8px 18px; border-radius:999px; font-weight:700; font-size:0.9rem; text-decoration:none;">
            <span>Watch Video</span>
            <span>→</span>
          </a>
          <button class="pw-copylink-btn" type="button" onclick="copyMediaCardPermalink('${m.id}', this)" title="Copy permalink to this video">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            <span>Copy Link</span>
          </button>
        </div>
      ` : `
        <div style="display:flex; justify-content:flex-end; align-items:center; margin-top:16px; border-top:1px solid #edf2f7; padding-top:14px;">
          <a href="${m.url.startsWith('http') || m.url.startsWith('/') ? m.url : '/' + m.url}" target="_blank" class="btn btn-secondary" style="display:inline-flex; align-items:center; gap:6px; padding:7px 16px; border-radius:999px; font-weight:600; font-size:0.85rem; text-decoration:none;">
            <span>View Full Image</span>
            <span>↗</span>
          </a>
        </div>
      `;

      return `
        <article class="pw-post" id="media-card-${m.id}" style="padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 24px; border-radius: 14px; background: #fff; border: 1px solid #edf2f7;">
          <div style="margin-bottom: 16px;">
            ${mediaElement}
          </div>
          <div class="pw-post-date" style="color:#718096; font-size:0.85rem; font-weight:600; text-transform:uppercase; letter-spacing:1px;">${formatDate(m.date)}</div>
          <p style="font-size: 1.15rem; font-weight: 600; margin-top: 10px; color:#1a202c; line-height:1.4;">${m.caption || ''}</p>
          ${actionsHtml}
        </article>
      `;
    }).join("");

    mount.innerHTML = `<div class="pw-list-stack" style="display: grid; gap: 24px;">${html}</div>`;
  }

  // Copy Permalink helper for media cards
  window.copyMediaCardPermalink = function(mediaId, btn) {
    const permalink = `${window.location.origin}/media/video/${encodeURIComponent(mediaId)}`;
    const span = btn ? btn.querySelector('span:last-child') : null;

    function markSuccess() {
      if (btn) btn.classList.add('copied');
      if (span) span.textContent = '✓ Copied!';
      showFloatingToast('Video link copied to clipboard!');
      setTimeout(() => {
        if (btn) btn.classList.remove('copied');
        if (span) span.textContent = 'Copy Link';
      }, 2500);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(permalink).then(markSuccess).catch(() => fallbackCopy(permalink, markSuccess));
    } else {
      fallbackCopy(permalink, markSuccess);
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

  function showFloatingToast(msg) {
    let toast = document.getElementById('mediaCardToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'mediaCardToast';
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
    const media = await fetchMedia();
    renderMedia(media);
  });
})();
