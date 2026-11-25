// BARAD HVAC Jeddah - External Interactive & Analytics Script (CSP-safe, zero inline scripts)
(function () {
  'use strict';

  // Plausible Analytics queue fallback
  window.plausible = window.plausible || function () {
    (window.plausible.q = window.plausible.q || []).push(arguments);
  };

  function trackEvent(eventName, props) {
    try {
      window.plausible(eventName, { props: props || {} });
    } catch (err) {
      // Ignore analytics errors if blocked by client extension
    }
  }

  // 1. Track all Call and WhatsApp clicks with Plausible events
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href') || '';
    var loc = link.getAttribute('data-track-loc') || 'page';
    if (href.indexOf('tel:') === 0) {
      trackEvent('Call Click', {
        location: loc,
        path: window.location.pathname
      });
    } else if (href.indexOf('wa.me') !== -1 || href.indexOf('whatsapp.com') !== -1) {
      trackEvent('WhatsApp Click', {
        location: loc,
        path: window.location.pathname
      });
    }
  });

  // 2. Mobile navigation menu toggle
  var menuBtn = document.getElementById('mobileMenuBtn');
  var mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function () {
      var expanded = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!expanded));
      mobileMenu.classList.toggle('hidden');
    });
    function closeMenu() {
      menuBtn.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.add('hidden');
    }
    // إغلاق القائمة عند اختيار رابط أو الضغط خارجها أو زر Escape
    mobileMenu.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) closeMenu();
    });
    document.addEventListener('click', function (e) {
      if (!mobileMenu.classList.contains('hidden') && !mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  // 3. Accessible Focus-Trapped Modal Controller
  var activeModal = null;
  var lastFocusedElement = null;

  function getFocusableElements(container) {
    return Array.prototype.slice.call(
      container.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  function openModal(modal, triggerEl) {
    if (!modal) return;
    lastFocusedElement = triggerEl || document.activeElement;
    activeModal = modal;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');

    var focusables = getFocusableElements(modal);
    if (focusables.length > 0) {
      focusables[0].focus();
    }
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
    activeModal = null;
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  document.addEventListener('keydown', function (e) {
    if (!activeModal) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal(activeModal);
      return;
    }
    if (e.key === 'Tab') {
      var focusables = getFocusableElements(activeModal);
      if (focusables.length === 0) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // 4. CR Certificate Modal (Lazy-loads CR certificate image ONLY when opened)
  var crModal = document.getElementById('crModal');
  var crImg = document.getElementById('crModalImg');
  var crAvifSource = document.getElementById('crModalAvif');
  var crWebpSource = document.getElementById('crModalWebp');
  var crLoaded = false;

  document.querySelectorAll('[data-open-cr-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!crLoaded && crImg) {
        if (crAvifSource && crAvifSource.dataset.srcset) {
          crAvifSource.setAttribute('srcset', crAvifSource.dataset.srcset);
        }
        if (crWebpSource && crWebpSource.dataset.srcset) {
          crWebpSource.setAttribute('srcset', crWebpSource.dataset.srcset);
        }
        if (crImg.dataset.src) {
          crImg.setAttribute('src', crImg.dataset.src);
        }
        crLoaded = true;
      }
      openModal(crModal, btn);
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var modal = btn.closest('[role="dialog"]');
      closeModal(modal);
    });
  });

  document.querySelectorAll('[role="dialog"]').forEach(function (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  // 5. Gallery Lightbox Modal
  var lightboxModal = document.getElementById('lightboxModal');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxCaption = document.getElementById('lightboxCaption');

  document.querySelectorAll('[data-gallery-item]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var fullSrc = btn.getAttribute('data-full-src');
      var caption = btn.getAttribute('data-caption') || '';
      if (lightboxImg && fullSrc) {
        lightboxImg.setAttribute('src', fullSrc);
        lightboxImg.setAttribute('alt', caption);
      }
      if (lightboxCaption) {
        lightboxCaption.textContent = caption;
      }
      openModal(lightboxModal, btn);
    });
  });

  // 6. Copy Commercial Registration Number
  var copyCrBtn = document.getElementById('copyCrBtn');
  var copyToast = document.getElementById('copyToast');
  if (copyCrBtn) {
    copyCrBtn.addEventListener('click', function () {
      var crNumber = copyCrBtn.getAttribute('data-cr') || '';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(crNumber);
      }
      if (copyToast) {
        copyToast.classList.remove('hidden');
        setTimeout(function () {
          copyToast.classList.add('hidden');
        }, 2800);
      }
    });
  }

  // 7. WhatsApp Service Request Form Handler
  var bookingForm = document.getElementById('whatsappBookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameInput = document.getElementById('clientName');
      var districtInput = document.getElementById('clientDistrict');
      var acTypeInput = document.getElementById('acTypeSelect');
      var serviceInput = document.getElementById('serviceTypeSelect');
      var notesInput = document.getElementById('clientNotes');
      var cardInput = document.getElementById('clientCard');
      var remindersInput = document.getElementById('clientReminders');

      var name = nameInput ? nameInput.value.trim() : '';
      var district = districtInput ? districtInput.value.trim() : '';
      var acType = acTypeInput ? acTypeInput.value : '';
      var service = serviceInput ? serviceInput.value : '';
      var notes = notesInput ? notesInput.value.trim() : '';
      var card = cardInput ? cardInput.value.trim() : '';
      var reminders = remindersInput ? remindersInput.checked : false;

      trackEvent('WhatsApp Click', {
        location: 'booking_form',
        service: service,
        district: district || 'unspecified',
        path: window.location.pathname
      });

      var lines = [
        'السلام عليكم مؤسسة براد لصيانة التكييف والتبريد،',
        'أرغب في حجز موعد خدمة تكييف في جدة:',
        '• الاسم: ' + (name || 'غير محدد'),
        '• الحي: ' + (district || 'جدة'),
        '• نوع المكيف: ' + acType,
        '• الخدمة المطلوبة: ' + service
      ];
      if (notes) {
        lines.push('• تفاصيل إضافية: ' + notes);
      }
      if (card) {
        lines.push('• بطاقة الولاء باسم: ' + card);
      }
      if (reminders) {
        lines.push('• أوافق على استلام تذكيرات الصيانة عبر واتساب.');
      }
      var waPhone = bookingForm.getAttribute('data-wa-phone') || '';
      var waUrl = 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent(lines.join('\n'));
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    });
  }

  // واجهة عامة للنوافذ المنبثقة تستخدمها ملفات أخرى (مثل reviews.js)
  window.BaradUI = { openModal: openModal, closeModal: closeModal, trackEvent: trackEvent };
})();
