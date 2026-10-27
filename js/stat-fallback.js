/**
 * 访客统计兜底。
 *
 * 主题默认把 UV / PV 先渲染成转圈图标，等服务端返回数字后再替换。
 * 如果统计服务不可用（超时、502 等），转圈会一直留在页面上。
 * 这里在等待一段时间后把仍在转圈的占位替换为 “—”；若数据稍后到达，
 * 统计脚本仍会覆盖成真实数字。
 */
(function () {
  var SELECTOR = [
    '#busuanzi_value_site_uv',
    '#busuanzi_value_site_pv',
    '#busuanzi_value_page_pv',
    '#umami-site-uv',
    '#umami-site-pv',
    '#umamiPV'
  ].join(',');
  var FALLBACK_DELAY = 6000;

  function scheduleFallback(el) {
    if (el.dataset.statFallbackScheduled) return;
    el.dataset.statFallbackScheduled = '1';

    setTimeout(function () {
      if (el.querySelector('.fa-spinner')) {
        el.textContent = '—';
      }
    }, FALLBACK_DELAY);
  }

  function scan() {
    document.querySelectorAll(SELECTOR).forEach(scheduleFallback);
  }

  // PJAX 切换页面后会重新渲染这些占位，需要重新计时。
  if (window.btf && typeof window.btf.addGlobalFn === 'function') {
    window.btf.addGlobalFn('pjaxComplete', scan, 'stat_fallback');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }
})();
