// صفحة مراجعة التقييمات (للمالك فقط).
// الدخول بكوكي موقّع من الخادم (HttpOnly)، فلا تُخزَّن كلمة المرور في المتصفح إطلاقاً.
(function () {
  'use strict';
  var loginForm = document.getElementById('adminLogin');
  var panel = document.getElementById('adminPanel');
  var msgEl = document.getElementById('adminMsg');
  if (!loginForm) return;

  function msg(t) {
    msgEl.textContent = t || '';
    msgEl.classList.toggle('hidden', !t);
  }
  function api(body) {
    return fetch('/api/admin', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'barad-admin' },
      body: JSON.stringify(body)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (d) {
        if (!res.ok) {
          var err = new Error(d.error || 'خطأ');
          err.status = res.status;
          throw err;
        }
        return d;
      });
    });
  }

  function card(r, buttons) {
    var el = document.createElement('article');
    el.className = 'rounded-xl bg-card border border-line p-4 space-y-2';
    var head = document.createElement('p');
    head.className = 'text-sm font-bold text-ink';
    head.textContent = r.name + ' — ' + '★★★★★'.slice(0, r.rating) + ' — ' + r.service;
    var body = document.createElement('p');
    body.className = 'text-sm text-copy';
    body.textContent = r.text;
    var meta = document.createElement('p');
    meta.className = 'text-xs text-muted';
    meta.textContent = (r.phone ? 'الجوال: ' + r.phone + ' • ' : '') + new Date(r.createdAt).toLocaleString('ar-SA');
    var row = document.createElement('div');
    row.className = 'flex gap-2 pt-1';
    buttons.forEach(function (b) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = b.label;
      btn.className = 'px-4 py-2 rounded-lg text-sm font-bold text-white ' + b.cls;
      btn.addEventListener('click', function () {
        btn.disabled = true;
        api({ action: b.action, id: r.id }).then(function () { return load(); }).catch(function (e) { msg(e.message); btn.disabled = false; });
      });
      row.appendChild(btn);
    });
    [head, body, meta, row].forEach(function (x) { el.appendChild(x); });
    return el;
  }

  function fill(listId, countId, items, buttons, emptyText) {
    var list = document.getElementById(listId);
    list.textContent = '';
    document.getElementById(countId).textContent = items.length;
    if (!items.length) {
      var p = document.createElement('p');
      p.className = 'text-sm text-muted';
      p.textContent = emptyText;
      list.appendChild(p);
    }
    items.forEach(function (r) { list.appendChild(card(r, buttons)); });
  }

  function showLogin() {
    loginForm.classList.remove('hidden');
    panel.classList.add('hidden');
  }

  // silent: عند فتح الصفحة لا نُظهر خطأ إن لم تكن هناك جلسة
  function load(silent) {
    msg('');
    return api({ action: 'list' }).then(function (d) {
      loginForm.classList.add('hidden');
      panel.classList.remove('hidden');
      fill('pendingList', 'pendingCount', d.pending, [
        { label: 'موافقة ونشر', action: 'approve', cls: 'bg-ok hover:bg-wa-hover' },
        { label: 'رفض', action: 'reject', cls: 'bg-danger hover:opacity-90' }
      ], 'لا توجد تقييمات معلّقة.');
      fill('approvedList', 'approvedCount', d.approved, [
        { label: 'حذف من الموقع', action: 'delete', cls: 'bg-danger hover:opacity-90' }
      ], 'لا توجد تقييمات منشورة.');
    }).catch(function (e) {
      showLogin();
      if (!(silent && e.status === 401)) msg(e.message);
    });
  }

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var pwEl = document.getElementById('adminPw');
    api({ action: 'login', password: pwEl.value })
      .then(function () { pwEl.value = ''; return load(); })
      .catch(function (err) { msg(err.message); });
  });
  document.getElementById('adminLogout').addEventListener('click', function () {
    api({ action: 'logout' }).catch(function () {}).then(function () { location.reload(); });
  });
  load(true);
})();
