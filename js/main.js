/* 
 * Waterbrooks site scripts
 */

document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // Mobile navigation toggling
  // =========================
  const hamburger = document.getElementById("hamburger");
  const navList = document.querySelector(".nav-list");

  const closeMenu = () => {
    if (!navList || !hamburger) return;
    navList.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
  };

  hamburger?.addEventListener("click", () => {
    if (!navList) return;
    const isOpen = navList.classList.toggle("open");
    hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Close menu when you click any menu link (mobile)
  document.querySelectorAll(".nav-list .nav-link").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Close menu if user taps outside the dropdown
  document.addEventListener("click", (e) => {
    if (!navList || !hamburger) return;

    const clickedInsideMenu = navList.contains(e.target);
    const clickedHamburger = hamburger.contains(e.target);

    if (!clickedInsideMenu && !clickedHamburger) {
      closeMenu();
    }
  });

  // Close menu on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // =========================
  // Hero background slideshow (with preload to prevent flash)
  // =========================
  const heroSection = document.querySelector(".hero");

  if (heroSection) {
    const heroImages = [
      "images/hero.jpg",
      "images/hero2.jpg",
      "images/hero3.jpg",
      "images/hero4.png",
      "images/hero5.png",
      "images/hero6.png",
    ];

    let currentHeroIndex = 0;
    let slideshowTimer = null;

    const preloadImage = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ src, ok: true });
        img.onerror = () => resolve({ src, ok: false });
        img.src = src;
      });

    const startSlideshow = () => {
      if (slideshowTimer) return;

      slideshowTimer = setInterval(() => {
        currentHeroIndex = (currentHeroIndex + 1) % heroImages.length;
        heroSection.style.backgroundImage = `url('${heroImages[currentHeroIndex]}')`;
      }, 5000);
    };

    preloadImage(heroImages[0]).then(() => {
      heroSection.style.backgroundImage = `url('${heroImages[0]}')`;
      document.body.classList.add("hero-ready");
    });

    Promise.all(heroImages.slice(1).map(preloadImage)).then(() => {
      startSlideshow();
    });
  }

  // =========================
  // Highlight active nav link
  // =========================
  const navLinks = document.querySelectorAll(".nav-link");
  const currentPage = window.location.pathname.split("/").pop().split("?")[0].split("#")[0];

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if ((currentPage === "" && href === "index.html") || currentPage === href) {
      link.classList.add("active");
    }
  });

  // =========================
  // Member stories slider dots
  // =========================
  const sliderDots = document.querySelectorAll(".slider-dots .dot");
  const experienceSlides = document.querySelectorAll(".experience-slides .slide");

  if (sliderDots.length && experienceSlides.length) {
    sliderDots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        experienceSlides.forEach((slide) => slide.classList.remove("active"));
        sliderDots.forEach((d) => d.classList.remove("active"));
        experienceSlides[index].classList.add("active");
        dot.classList.add("active");
      });
    });
  }

  // =========================
  // GIVE MODAL POPUP (Give Page) ✅ WORKS ON MOBILE + PC
  // =========================
  const giveBtn = document.getElementById("giveNowBtn");          // <a href="#giveModal" ...>
  const modal = document.getElementById("giveModal");             // <div id="giveModal" ...>
  const closeBtn = document.getElementById("closeGiveModal");     // <a href="#" id="closeGiveModal"...>
  const copyBtn = document.getElementById("copyAccountBtn");      // <button id="copyAccountBtn"...>
  const acctText = document.getElementById("accountNumberText");  // <p id="accountNumberText"...>
  const statusText = document.getElementById("copyStatusText");   // <p id="copyStatusText"...>

  const setStatus = (msg) => {
    if (!statusText) return;
    statusText.textContent = msg;
    setTimeout(() => {
      statusText.textContent = "";
    }, 2000);
  };

  const copyFallback = (text) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);

    // iOS needs selection in a user gesture
    ta.focus();
    ta.select();

    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }

    document.body.removeChild(ta);
    return ok;
  };

  const openModal = () => {
    if (!modal) return;

    // Ensure modal is interactive only when open
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // Support anchor-based (#giveModal) behavior too
    if (window.location.hash !== "#giveModal") {
      window.location.hash = "giveModal";
    }
  };

  const closeModal = () => {
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (statusText) statusText.textContent = "";

    // Clear hash so it doesn't stay stuck on #giveModal
    if (window.location.hash === "#giveModal") {
      history.pushState("", document.title, window.location.pathname + window.location.search);
    }
  };

  // Bind only if Give elements exist
  if (giveBtn && modal) {
    // Open: handle both click + touch (mobile)
    const handleOpen = (e) => {
      // If it's an <a href="#giveModal">, prevent browser jump
      e.preventDefault();
      openModal();
    };

    giveBtn.addEventListener("click", handleOpen);
    giveBtn.addEventListener("touchend", handleOpen, { passive: false });

    // Close button is <a href="#">, prevent navigation to top
    const handleClose = (e) => {
      e.preventDefault();
      closeModal();
    };

    closeBtn?.addEventListener("click", handleClose);
    closeBtn?.addEventListener("touchend", handleClose, { passive: false });

    // Click outside card closes (but only when open)
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    // Esc closes
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && (modal.classList.contains("is-open") || window.location.hash === "#giveModal")) {
        closeModal();
      }
    });

    // If user loads the page already with #giveModal, open it
    if (window.location.hash === "#giveModal") {
      openModal();
    }

    // Copy account number ✅ (Clipboard API + fallback + prompt)
   if (copyBtn && acctText) {
  const hardCopy = (text) => {
    // Most reliable fallback for mobile + http
    const input = document.createElement("input");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.style.top = "-9999px";
    document.body.appendChild(input);

    input.focus();
    input.select();
    input.setSelectionRange(0, input.value.length);

    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }

    document.body.removeChild(input);
    return ok;
  };

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const value = (acctText.textContent || "").trim();
    if (!value) return setStatus("No account number found.");

    // Try modern clipboard first (works on https / localhost)
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(value);
        return setStatus("Account number copied!");
      }
    } catch (err) {
      // ignore and fallback
    }

    // Fallback that works on many mobile browsers
    const ok = hardCopy(value);
    if (ok) return setStatus("Account number copied!");

    // Last resort: always gives user the number to copy manually
    window.prompt("Copy account number:", value);
    setStatus("Tap and hold to copy.");
  };

  // IMPORTANT: pointerdown works better than click/touchend in some mobile browsers
  copyBtn.addEventListener("pointerdown", handleCopy);
  copyBtn.addEventListener("click", handleCopy);
}


  }

  // =========================
  // Mailing List Submission (iframe submit)
  // =========================
  const mailingForm = document.getElementById("mailingForm");
  const pageInput = document.getElementById("mailingPage");
  const mailingBtn = document.getElementById("mailingBtn");

  if (mailingForm) {
    mailingForm.addEventListener("submit", () => {
      if (pageInput) pageInput.value = window.location.pathname;

      if (mailingBtn) {
        mailingBtn.disabled = true;
        mailingBtn.textContent = "Submitting...";
      }

      setTimeout(() => {
        alert("Thank you. You have been added to our mailing list.");
        mailingForm.reset();

        if (mailingBtn) {
          mailingBtn.disabled = false;
          mailingBtn.textContent = "Submit";
        }
      }, 1200);
    });
  }

  // =========================
  // Signup Form
  // =========================
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    const btn = document.getElementById("signupSubmitBtn");
    const hiddenAge = document.getElementById("ageGroupCombined");

    signupForm.addEventListener("submit", () => {
      const checked = Array.from(signupForm.querySelectorAll('input[name="ageGroup"]:checked')).map(
        (cb) => cb.value
      );

      if (hiddenAge) hiddenAge.value = checked.join(", ");

      if (btn) {
        btn.disabled = true;
        btn.textContent = "Submitting...";
      }

      setTimeout(() => {
        alert("Thank you. Your signup has been received.");
        signupForm.reset();

        if (hiddenAge) hiddenAge.value = "";

        if (btn) {
          btn.disabled = false;
          btn.textContent = "Submit";
        }
      }, 1200);
    });
  }

  // =========================
  // Celebration Form
  // =========================
  const celebrationForm = document.getElementById("celebrationForm");
  const celebrationBtn = document.getElementById("celebrationSubmitBtn");

  if (celebrationForm) {
    celebrationForm.addEventListener("submit", () => {
      if (celebrationBtn) {
        celebrationBtn.disabled = true;
        celebrationBtn.textContent = "Submitting...";
      }

      setTimeout(() => {
        alert("Thank you. Your celebration request has been received.");
        celebrationForm.reset();

        if (celebrationBtn) {
          celebrationBtn.disabled = false;
          celebrationBtn.textContent = "Submit";
        }
      }, 1200);
    });
  }

  // =========================
  // Contact Form
  // =========================
  const contactForm = document.getElementById("contactForm");
  const contactBtn = document.getElementById("contactSubmitBtn");

  if (contactForm) {
    contactForm.addEventListener("submit", () => {
      if (contactBtn) {
        contactBtn.disabled = true;
        contactBtn.textContent = "Submitting...";
      }

      setTimeout(() => {
        alert("Thank you. Your message has been received. We will get back to you shortly.");
        contactForm.reset();

        if (contactBtn) {
          contactBtn.disabled = false;
          contactBtn.textContent = "Submit";
        }
      }, 1200);
    });
  }
});

// ===== Google Sheets Web App URL =====
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby3Py_tvc4kdqgbEdp7tV8jtHlYu6yBiAN45pFgBWXrS89lsF18Cb6qeqTDThkko0MRTg/exec";

// Reliable Apps Script POST (avoids preflight/CORS issues)
async function sendToSheets(formType, data) {
  const res = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ formType, data }),
  });

  const text = await res.text();
  let result = {};
  try {
    result = JSON.parse(text);
  } catch {
    result = { ok: false, error: text };
  }

  if (!result.ok) throw new Error(result.error || "Submission failed");
  return result;
}
