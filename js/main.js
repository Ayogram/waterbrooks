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

/* Close menu when you click any menu link (mobile) */
document.querySelectorAll(".nav-list .nav-link").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

/* Close menu if user taps outside the dropdown */
document.addEventListener("click", (e) => {
  if (!navList || !hamburger) return;

  const clickedInsideMenu = navList.contains(e.target);
  const clickedHamburger = hamburger.contains(e.target);

  if (!clickedInsideMenu && !clickedHamburger) {
    closeMenu();
  }
});

/* Close menu on Escape key */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
});


  // =========================
  // Hero background slideshow (with preload to prevent blue flash)
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
      // avoid multiple intervals
      if (slideshowTimer) return;

      slideshowTimer = setInterval(() => {
        currentHeroIndex = (currentHeroIndex + 1) % heroImages.length;
        heroSection.style.backgroundImage = `url('${heroImages[currentHeroIndex]}')`;
      }, 5000);
    };

    // 1) Load the first image, then show overlay/content (prevents the blue flash)
    preloadImage(heroImages[0]).then(() => {
      heroSection.style.backgroundImage = `url('${heroImages[0]}')`;
      document.body.classList.add("hero-ready");
    });

    // 2) Preload the rest in the background, then start slideshow
    Promise.all(heroImages.slice(1).map(preloadImage)).then(() => {
      startSlideshow();
    });
  }

  // =========================
  // Highlight active nav link
  // =========================
  const navLinks = document.querySelectorAll(".nav-link");
  const currentPage = window.location.pathname.split("/").pop();

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
});

// ===== Give Modal Popup (Give Page) =====
document.addEventListener("DOMContentLoaded", () => {
  const giveBtn = document.getElementById("giveNowBtn");
  const modal = document.getElementById("giveModal");
  const closeBtn = document.getElementById("closeGiveModal");
  const copyBtn = document.getElementById("copyAccountBtn");
  const acctText = document.getElementById("accountNumberText");
  const statusText = document.getElementById("copyStatusText");

  if (!giveBtn || !modal) return;

  const openModal = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (statusText) statusText.textContent = "";
  };

  giveBtn.addEventListener("click", openModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  if (copyBtn && acctText) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(acctText.textContent.trim());
        if (statusText) statusText.textContent = "Account number copied!";
        setTimeout(() => {
          if (statusText) statusText.textContent = "";
        }, 2000);
      } catch (err) {
        if (statusText) statusText.textContent = "Copy failed. Please copy manually.";
      }
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

// ===== Mailing List Submission =====
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("mailingForm");
  const pageInput = document.getElementById("mailingPage");
  const btn = document.getElementById("mailingBtn");

  if (!form) return;

  form.addEventListener("submit", () => {
    if (pageInput) pageInput.value = window.location.pathname;

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Submitting...";
    }

    setTimeout(() => {
      alert("Thank you. You have been added to our mailing list.");
      form.reset();

      if (btn) {
        btn.disabled = false;
        btn.textContent = "Submit";
      }
    }, 1200);
  });
});

// ===== Signup Form =====
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  if (!signupForm) return;

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
});

// ===== Celebration Form =====
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("celebrationForm");
  const btn = document.getElementById("celebrationSubmitBtn");

  if (!form) return;

  form.addEventListener("submit", () => {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Submitting...";
    }

    setTimeout(() => {
      alert("Thank you. Your celebration request has been received.");
      form.reset();

      if (btn) {
        btn.disabled = false;
        btn.textContent = "Submit";
      }
    }, 1200);
  });
});

// ===== Contact Form =====
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const btn = document.getElementById("contactSubmitBtn");

  if (!form) return;

  form.addEventListener("submit", () => {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Submitting...";
    }

    setTimeout(() => {
      alert("Thank you. Your message has been received. We will get back to you shortly.");
      form.reset();

      if (btn) {
        btn.disabled = false;
        btn.textContent = "Submit";
      }
    }, 1200);
  });
});
