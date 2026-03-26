-- Migration 020 — Fix internal P&P link navigation
-- Appends a JS intercept to all active policy documents so that clicks on
-- /pp/ links navigate window.top instead of the embedded content frame,
-- preventing the nested-portal rendering bug.

UPDATE pp_policies
SET
  html_content = html_content || $NAV_FIX$
<script>
(function(){
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a[href^="/pp/"]');
    if (a) {
      e.preventDefault();
      var target = window.top || window;
      target.location.href = a.getAttribute('href');
    }
  });
})();
</script>$NAV_FIX$,
  updated_at = NOW()
WHERE status = 'active';
