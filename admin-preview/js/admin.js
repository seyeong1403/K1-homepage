/* (주)케이원 관리자 — 화면 보조 스크립트.
   서버가 이미 동작을 다 하고 있으므로, 여기서는 실수를 줄이는 일만 한다. */
(function () {
  'use strict';

  /* 삭제는 되돌릴 수 없으니 한 번 더 묻는다. */
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-confirm]');
    if (form && !window.confirm(form.dataset.confirm)) {
      e.preventDefault();
    }
  });

  /* 두 번 눌러 같은 글이 두 개 올라가는 일을 막는다. */
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form.dataset.confirm || form.dataset.noLock) return;
    var btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    setTimeout(function () {
      btn.disabled = true;
      btn.textContent = '저장 중…';
    }, 0);
  });

  /* 사진을 고르면 올리기 전에 미리 보여준다. */
  var picker = document.querySelector('[data-preview]');
  if (picker) {
    var box = document.querySelector(picker.dataset.preview);
    var img = box && box.querySelector('img');
    var name = document.querySelector('[data-file-name]');

    picker.addEventListener('change', function () {
      var file = picker.files && picker.files[0];
      if (!file) return;
      if (name) name.textContent = file.name;
      if (img) {
        img.src = URL.createObjectURL(file);
        box.style.display = 'block';
      }
    });
  }
})();
