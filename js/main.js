/* Waterbrooks site scripts (single source of truth) */

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

  if (hamburger && navList) {
    hamburger.addEventListener("click", () => {
      const isOpen = navList.classList.toggle("open");
      hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Close menu when you click any menu link (mobile)
    document.querySelectorAll(".nav-list .nav-link").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    // Close menu if user taps outside the dropdown
    document.addEventListener("click", (e) => {
      const clickedInsideMenu = navList.contains(e.target);
      const clickedHamburger = hamburger.contains(e.target);
      if (!clickedInsideMenu && !clickedHamburger) closeMenu();
    });

    // Close menu on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  // =========================
  // Hero background slideshow (optional)
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

    setInterval(() => {
      currentHeroIndex = (currentHeroIndex + 1) % heroImages.length;
      heroSection.style.backgroundImage = `url('${heroImages[currentHeroIndex]}')`;
    }, 5000);
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
  // GIVE MODAL (Give Page)
  // =========================
  const giveBtn = document.getElementById("giveNowBtn");
  const modal = document.getElementById("giveModal");
  const closeBtn = document.getElementById("closeGiveModal");

  const copyBtn = document.getElementById("copyAccountBtn");
  const acctText = document.getElementById("accountNumberText");
  const statusText = document.getElementById("copyStatusText");

  const setStatus = (msg) => {
    if (!statusText) return;
    statusText.textContent = msg;
    setTimeout(() => {
      statusText.textContent = "";
    }, 2000);
  };

  const hardCopy = (text) => {
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
    } catch {
      ok = false;
    }

    document.body.removeChild(input);
    return ok;
  };

 const openModal = () => {
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
};


 const closeModal = () => {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (statusText) statusText.textContent = "";
};



  if (giveBtn && modal) {
    const handleOpen = (e) => {
      e.preventDefault();
      openModal();
    };

    giveBtn.addEventListener("click", handleOpen);
    giveBtn.addEventListener("touchend", handleOpen, { passive: false });

    const handleClose = (e) => {
      e.preventDefault();
      closeModal();
    };

    closeBtn?.addEventListener("click", handleClose);
    closeBtn?.addEventListener("touchend", handleClose, { passive: false });

    // Click outside card closes
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    // Esc closes
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && (modal.classList.contains("is-open") || window.location.hash === "#giveModal")) {
        closeModal();
      }
    });

  }

  // Copy account number
  if (copyBtn && acctText) {
    const handleCopy = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const value = (acctText.textContent || "").trim();
      if (!value) return setStatus("No account number found.");

      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          await navigator.clipboard.writeText(value);
          return setStatus("Account number copied!");
        }
      } catch {
        // fallback below
      }

      const ok = hardCopy(value);
      if (ok) return setStatus("Account number copied!");

      window.prompt("Copy account number:", value);
      setStatus("Tap and hold to copy.");
    };

    copyBtn.addEventListener("pointerdown", handleCopy);
    copyBtn.addEventListener("click", handleCopy);
  }

  // =========================
  // Mailing List Submission (IFRAME submit - reliable)
  // IMPORTANT: This assumes your form has action+method+target="hidden_iframe"
  // =========================
  const mailingForm = document.getElementById("mailingForm");
  const pageInput = document.getElementById("mailingPage");
  const mailingBtn = document.getElementById("mailingBtn");

  if (mailingForm) {
    mailingForm.addEventListener("submit", () => {
      // DO NOT preventDefault() — let the form post to Google Apps Script
      if (pageInput) pageInput.value = window.location.pathname;

      if (mailingBtn) {
        mailingBtn.disabled = true;
        mailingBtn.textContent = "Submitting...";
      }

      // We can't read the iframe response (cross-origin), so we show a friendly confirmation
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
  // Generic IFRAME form helper (reliable on localhost + production)
  // =========================
  const wireIframeForm = ({
    formId,
    btnId,
    successMessage,
    beforeSubmit, // optional callback
  }) => {
    const form = document.getElementById(formId);
    if (!form) return;

    const btn = btnId ? document.getElementById(btnId) : null;

    form.addEventListener("submit", () => {
      // Do NOT preventDefault — let it POST normally (usually into hidden iframe)

      try {
        if (typeof beforeSubmit === "function") beforeSubmit(form);
      } catch (e) {
        console.error(e);
      }

      if (btn) {
        btn.disabled = true;
        btn.textContent = "Submitting...";
      }

      setTimeout(() => {
        alert(successMessage);
        form.reset();

        if (btn) {
          btn.disabled = false;
          btn.textContent = "Submit";
        }
      }, 1200);
    });
  };

  // =========================
  // SIGNUP FORM
  // =========================
  wireIframeForm({
    formId: "signupForm",
    btnId: "signupSubmitBtn",
    successMessage: "Thank you. Your signup has been received.",
    beforeSubmit: (form) => {
      // If you use checkboxes for ageGroup and want a combined hidden field:
      const hiddenAge = document.getElementById("ageGroupCombined");
      if (!hiddenAge) return;

      const checked = Array.from(form.querySelectorAll('input[name="ageGroup"]:checked')).map(
        (cb) => cb.value
      );

      hiddenAge.value = checked.join(", ");
    },
  });

  // =========================
  // CONTACT FORM
  // =========================
  wireIframeForm({
    formId: "contactForm",
    btnId: "contactSubmitBtn",
    successMessage: "Thank you. Your message has been received. We will get back to you shortly.",
  });

  // =========================
  // CELEBRATION FORM (if present)
  // =========================
  wireIframeForm({
    formId: "celebrationForm",
    btnId: "celebrationSubmitBtn",
    successMessage: "Thank you. Your celebration request has been received.",
  });

});
