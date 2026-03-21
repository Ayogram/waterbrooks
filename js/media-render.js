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
        if (url.includes('facebook.com') && (url.includes('/posts/') || url.includes('/p/') || url.includes('/share/p/'))) {
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

      if (m.type === 'link' || m.type === 'youtube') {
         const parsed = parseMediaLink(m.url);
         
         if (parsed && parsed.platform === 'youtube') {
           mediaElement = `
             <div class="yt-preview-wrapper" 
                  style="position:relative; width:100%; padding-bottom:56.25%; height:0; border-radius:12px; overflow:hidden; background:#000; cursor:pointer;"
                  onmouseenter="this.querySelector('.yt-iframe-placeholder').innerHTML = '<iframe width=\\'100%\\' height=\\'100%\\' src=\\'${parsed.embedUrl}\\' frameborder=\\'0\\' allow=\\'autoplay; encrypted-media; picture-in-picture\\' allowfullscreen style=\\'position:absolute; top:0; left:0; width:100%; height:100%; z-index:2;\\'></iframe>'; this.querySelector('.yt-thumb').style.opacity='0'; this.querySelector('.yt-overlay-hint').style.display='flex';"
                  onmouseleave="this.querySelector('.yt-iframe-placeholder').innerHTML = ''; this.querySelector('.yt-thumb').style.opacity='1'; this.querySelector('.yt-overlay-hint').style.display='none';">
               <img class="yt-thumb" src="${parsed.thumbUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; transition: opacity 0.4s ease; z-index:1;" onerror="this.src='images/logo.png'">
               <div class="yt-iframe-placeholder" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:2;"></div>
               <a href="${m.url}" target="_blank" class="yt-overlay-hint" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:4; display:none; align-items:flex-end; justify-content:center; padding-bottom:20px; background:rgba(0,0,0,0.2); text-decoration:none; cursor:pointer;">
                 <div style="background:rgba(0,86,179,0.9); color:#fff; padding:8px 16px; border-radius:30px; font-weight:600; font-size:0.9em; box-shadow:0 4px 10px rgba(0,0,0,0.3);">Watch Full Sermon →</div>
               </a>
               <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); z-index:3; color:#fff; font-size:48px; pointer-events:none; opacity:0.8; text-shadow:0 4px 10px rgba(0,0,0,0.5);">▶</div>
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
                   onmouseenter="this.querySelector('.yt-overlay-hint').style.display='flex';"
                   onmouseleave="this.querySelector('.yt-overlay-hint').style.display='none';">
                <iframe src="${parsed.embedUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:none; overflow:hidden;" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
                <a href="${m.url}" target="_blank" class="yt-overlay-hint" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:4; display:none; align-items:flex-end; justify-content:center; padding-bottom:20px; background:rgba(0,0,0,0.2); text-decoration:none; cursor:pointer;">
                 <div style="background:rgba(0,86,179,0.9); color:#fff; padding:8px 16px; border-radius:30px; font-weight:600; font-size:0.9em; box-shadow:0 4px 10px rgba(0,0,0,0.3);">Watch Full →</div>
                </a>
              </div>
            `;
         } else if (parsed && parsed.platform === 'image') {
            mediaElement = `
              <div class="yt-preview-wrapper" style="position:relative; width:100%; height:300px; border-radius:12px; overflow:hidden; background:#000; cursor:pointer;"
                   onmouseenter="this.querySelector('.yt-overlay-hint').style.display='flex';"
                   onmouseleave="this.querySelector('.yt-overlay-hint').style.display='none';">
                <img src="${parsed.embedUrl}" style="width:100%; height:100%; object-fit:contain;">
                <a href="${m.url}" target="_blank" class="yt-overlay-hint" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:4; display:none; align-items:flex-end; justify-content:center; padding-bottom:20px; background:rgba(0,0,0,0.2); text-decoration:none; cursor:pointer;">
                 <div style="background:rgba(0,86,179,0.9); color:#fff; padding:8px 16px; border-radius:30px; font-weight:600; font-size:0.9em; box-shadow:0 4px 10px rgba(0,0,0,0.3);">View Full →</div>
                </a>
              </div>
            `;
         } else if (parsed && parsed.platform === 'video') {
            mediaElement = `
              <div class="yt-preview-wrapper" style="position:relative; width:100%; height:300px; border-radius:12px; overflow:hidden; background:#000; cursor:pointer;"
                   onmouseenter="this.querySelector('video').play(); this.querySelector('.yt-overlay-hint').style.display='flex';"
                   onmouseleave="this.querySelector('video').pause(); this.querySelector('.yt-overlay-hint').style.display='none';">
                <video src="${parsed.embedUrl}" muted loop style="width:100%; height:100%; object-fit:contain;"></video>
                <a href="${m.url}" target="_blank" class="yt-overlay-hint" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:4; display:none; align-items:flex-end; justify-content:center; padding-bottom:20px; background:rgba(0,0,0,0.2); text-decoration:none; cursor:pointer;">
                 <div style="background:rgba(0,86,179,0.9); color:#fff; padding:8px 16px; border-radius:30px; font-weight:600; font-size:0.9em; box-shadow:0 4px 10px rgba(0,0,0,0.3);">Watch Full →</div>
                </a>
              </div>
            `;
         } else {
           mediaElement = `<a href="${m.url}" target="_blank" style="display:inline-block; padding:12px 24px; background:#0056b3; color:#fff; border-radius:30px; text-decoration:none; font-weight:600;">Watch Live Video Stream</a>`;
         }
      } else if (m.type === 'video') {
        mediaElement = `<video controls muted loop src="${m.url}" style="width: 100%; border-radius: 12px; background:#000;" onmouseenter="this.play()" onmouseleave="this.pause()"></video>`;
      } else {
        mediaElement = `<img src="${m.url}" alt="${m.caption}" style="width: 100%; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);" />`;
      }

      return `
        <article class="pw-post" style="padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 24px; border-radius: 12px; background: #fff; border: 1px solid #edf2f7;">
          <div style="margin-bottom: 16px;">
            ${mediaElement}
          </div>
          <div class="pw-post-date" style="color:#718096; font-size:0.85rem; font-weight:600; text-transform:uppercase; letter-spacing:1px;">${formatDate(m.date)}</div>
          <p style="font-size: 1.15rem; font-weight: 600; margin-top: 10px; color:#1a202c; line-height:1.4;">${m.caption}</p>
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
