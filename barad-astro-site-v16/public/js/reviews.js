// تقييمات العملاء: عرض المعتمد منها + نافذة الإضافة (تحقق الجوال ثم كتابة التقييم).
(function () {
  'use strict';
  var modal = document.getElementById('reviewModal');
  var listEl = document.getElementById('reviewsList');
  if (!modal || !listEl) return;

  var summaryEl = document.getElementById('reviewsSummary');
  var moreBtn = document.getElementById('reviewsMore');
  var msgEl = document.getElementById('reviewMsg');
  var rating = 0;
  var allReviews = [];
  var shown = 0;
  var PAGE = 3;

  function stars(n) {
    return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
  }

  /* ---------- عرض التقييمات ---------- */
  function renderMore() {
    var next = allReviews.slice(shown, shown + PAGE);
    next.forEach(function (r) {
      var card = document.createElement('article');
      card.className = 'rounded-xl bg-card border border-line p-4';
      var top = document.createElement('div');
      top.className = 'flex items-center justify-between gap-2';
      var name = document.createElement('p');
      name.className = 'font-bold text-ink text-sm';
      name.textContent = r.name;
      var st = document.createElement('p');
      st.className = 'text-star text-sm';
      st.setAttribute('aria-label', r.rating + ' من 5');
      st.textContent = stars(r.rating);
      top.appendChild(name);
      top.appendChild(st);
      var svc = document.createElement('p');
      svc.className = 'text-xs text-brand mt-0.5';
      svc.textContent = r.service;
      var txt = document.createElement('p');
      txt.className = 'text-sm text-copy leading-relaxed mt-2';
      txt.textContent = r.text;
      card.appendChild(top);
      card.appendChild(svc);
      card.appendChild(txt);
      listEl.appendChild(card);
    });
    shown += next.length;
    moreBtn.classList.toggle('hidden', shown >= allReviews.length);
  }

  function loadReviews() {
    fetch('/api/reviews')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        allReviews = d.reviews || [];
        if (!allReviews.length) {
          summaryEl.textContent = 'كن أول من يقيّم خدمتنا.';
          return;
        }
        summaryEl.textContent = '★ ' + d.average + ' من 5 • ' + d.count + ' تقييم';
        renderMore();
      })
      .catch(function () {
        summaryEl.textContent = '';
      });
  }
  moreBtn.addEventListener('click', renderMore);

  /* ---------- نافذة الإضافة ---------- */

  function step(name) {
    modal.querySelectorAll('[data-step]').forEach(function (el) {
      el.classList.toggle('hidden', el.getAttribute('data-step') !== name);
    });
    msg('');
  }
  function msg(text, ok) {
    if (!text) {
      msgEl.classList.add('hidden');
      return;
    }
    msgEl.textContent = text;
    msgEl.className = 'text-sm font-bold rounded-lg px-3 py-2 mb-3 ' + (ok ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger');
  }
  function busy(btn, on) {
    btn.disabled = on;
    btn.classList.toggle('opacity-60', on);
  }

  document.querySelectorAll('[data-open-review-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      step('review');
      window.BaradUI.openModal(modal, btn);
    });
  });

  // النجوم
  var rating = 0;
  var starBtns = modal.querySelectorAll('[data-star]');
  starBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      rating = Number(b.getAttribute('data-star'));
      starBtns.forEach(function (s) {
        var n = Number(s.getAttribute('data-star'));
        s.classList.toggle('text-star', n <= rating);
        s.classList.toggle('text-line', n > rating);
        s.setAttribute('aria-checked', String(n === rating));
      });
    });
  });

  // إرسال التقييم
  document.getElementById('rvForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!rating) return msg('اختر عدد النجوم');
    var phone = document.getElementById('rvPhone').value.replace(/[\s\-()]/g, '');
    if (phone && !/^\+?[0-9٠-٩]{9,15}$/.test(phone)) return msg('رقم الجوال غير صحيح (أو اتركه فارغاً)');
    var btn = document.getElementById('rvSubmit');
    busy(btn, true);
    fetch('/api/reviews/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: rating,
        service: document.getElementById('rvService').value,
        name: document.getElementById('rvName').value,
        text: document.getElementById('rvText').value,
        phone: phone,
        website: document.getElementById('rvWebsite').value
      })
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        busy(btn, false);
        if (!res.ok) {
          return msg(data.error || 'حدث خطأ');
        }
        step('done');
      });
    }).catch(function () { busy(btn, false); msg('تعذر الاتصال بالخادم'); });
  });

  loadReviews();
})();
