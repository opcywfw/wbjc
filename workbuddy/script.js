(function () {
  var body = document.body;
  var menuButton = document.querySelector("[data-menu-button]");
  var overlay = document.querySelector("[data-overlay]");
  var sidebar = document.querySelector("[data-sidebar]");
  var links = document.querySelectorAll(".sidebar a[href]");

  function closeSidebar() {
    body.classList.remove("sidebar-open");
    if (menuButton) {
      menuButton.setAttribute("aria-expanded", "false");
    }
  }

  if (menuButton) {
    menuButton.addEventListener("click", function () {
      var isOpen = body.classList.toggle("sidebar-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });
  }

  if (overlay) {
    overlay.addEventListener("click", closeSidebar);
  }

  links.forEach(function (link) {
    link.addEventListener("click", function () {
      closeSidebar();
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeSidebar();
    }
  });

  if ("IntersectionObserver" in window && sidebar) {
    var sectionLinks = Array.prototype.slice.call(document.querySelectorAll(".sidebar a[href^='#']"));
    var sections = sectionLinks
      .map(function (link) {
        return document.querySelector(link.getAttribute("href"));
      })
      .filter(Boolean);

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          sectionLinks.forEach(function (link) {
            link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
          });
        });
      },
      { rootMargin: "-90px 0px -65% 0px", threshold: 0.01 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function resolvePopupUrl(url) {
    if (!url) {
      return "#";
    }
    if (/^(https?:)?\/\//.test(url) || url.indexOf("mailto:") === 0 || url.indexOf("tel:") === 0) {
      return url;
    }
    var configScript = document.querySelector('script[src$="popup-config.js"]');
    if (configScript && configScript.src) {
      return new URL(url, configScript.src).href;
    }
    return url;
  }

  function appendText(parent, className, text) {
    var element = document.createElement("span");
    if (className) {
      element.className = className;
    }
    element.textContent = text || "";
    parent.appendChild(element);
    return element;
  }

  function createExternalLink(className, text, url) {
    var link = document.createElement("a");
    link.className = className;
    link.href = resolvePopupUrl(url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    if (text) {
      link.textContent = text;
    }
    return link;
  }

  function initFloatingPopup() {
    var config = window.WORKBUDDY_FLOAT_POPUP;
    if (!config || config.enabled === false) {
      return;
    }

    var popup = document.createElement("aside");
    popup.className = "float-popup";
    popup.setAttribute("aria-label", config.title || "推荐内容");

    var ribbon = document.createElement("div");
    ribbon.className = "float-popup-ribbon";
    appendText(ribbon, "float-popup-dot", "");
    appendText(ribbon, "", config.ribbonText || "限时推荐");
    popup.appendChild(ribbon);

    var closeButton = document.createElement("button");
    closeButton.className = "float-popup-close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "关闭弹窗");
    closeButton.textContent = "×";
    popup.appendChild(closeButton);

    var inner = document.createElement("div");
    inner.className = "float-popup-inner";
    popup.appendChild(inner);

    var titleRow = document.createElement("div");
    titleRow.className = "float-popup-title-row";
    appendText(titleRow, "float-popup-icon", config.icon || "🎁");
    var title = document.createElement("strong");
    title.textContent = config.title || "";
    titleRow.appendChild(title);
    if (config.badge) {
      appendText(titleRow, "float-popup-badge", config.badge);
    }
    inner.appendChild(titleRow);

    if (config.description) {
      var description = document.createElement("p");
      description.className = "float-popup-description";
      description.textContent = config.description;
      inner.appendChild(description);
    }

    if (Array.isArray(config.stats) && config.stats.length) {
      var stats = document.createElement("div");
      stats.className = "float-popup-stats";
      config.stats.slice(0, 2).forEach(function (item) {
        var stat = document.createElement("div");
        appendText(stat, "float-popup-stat-value", item.value);
        appendText(stat, "float-popup-stat-label", item.label);
        stats.appendChild(stat);
      });
      inner.appendChild(stats);
    }

    if (config.couponCode) {
      var coupon = document.createElement("div");
      coupon.className = "float-popup-coupon";
      appendText(coupon, "float-popup-coupon-label", config.couponLabel || "专属口令：");
      var code = appendText(coupon, "float-popup-coupon-code", config.couponCode);
      var copyButton = document.createElement("button");
      copyButton.className = "float-popup-copy";
      copyButton.type = "button";
      copyButton.setAttribute("aria-label", "复制口令");
      copyButton.textContent = "复制";
      copyButton.addEventListener("click", function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(config.couponCode).then(function () {
            copyButton.textContent = "已复制";
            window.setTimeout(function () {
              copyButton.textContent = "复制";
            }, 1200);
          });
        } else {
          code.focus();
        }
      });
      coupon.appendChild(copyButton);
      inner.appendChild(coupon);
    }

    inner.appendChild(createExternalLink("float-popup-primary", config.primaryButtonText, config.primaryButtonUrl));

    if (Array.isArray(config.features) && config.features.length) {
      var features = document.createElement("div");
      features.className = "float-popup-features";
      config.features.slice(0, 3).forEach(function (feature) {
        appendText(features, "", "✓ " + feature);
      });
      inner.appendChild(features);
    }

    if (config.secondaryCard && config.secondaryCard.title) {
      var card = createExternalLink("float-popup-secondary", "", config.secondaryCard.url);
      var cardText = document.createElement("span");
      cardText.className = "float-popup-secondary-text";
      appendText(cardText, "float-popup-secondary-title", config.secondaryCard.title);
      appendText(cardText, "float-popup-secondary-subtitle", config.secondaryCard.subtitle || "");
      card.appendChild(cardText);

      var qrWrap = document.createElement("span");
      qrWrap.className = "float-popup-secondary-qr";
      if (config.secondaryCard.qrImageUrl) {
        var qrImage = document.createElement("img");
        qrImage.src = resolvePopupUrl(config.secondaryCard.qrImageUrl);
        qrImage.alt = config.secondaryCard.qrAlt || "二维码";
        qrImage.loading = "lazy";
        qrWrap.appendChild(qrImage);
      } else {
        appendText(qrWrap, "float-popup-secondary-qr-placeholder", "二维码");
      }
      appendText(qrWrap, "float-popup-secondary-caption", config.secondaryCard.qrCaption || "扫码领取3天体验卡");
      card.appendChild(qrWrap);
      inner.appendChild(card);
    }

    closeButton.addEventListener("click", function () {
      popup.classList.remove("is-visible");
      window.setTimeout(function () {
        popup.remove();
      }, 220);
    });

    document.body.appendChild(popup);
    window.requestAnimationFrame(function () {
      popup.classList.add("is-visible");
    });
  }

  initFloatingPopup();
})();
