/**
 * QR Campaign Tracker - Landing Page Event Tracking Script
 *
 * Include on target landing pages:
 * <script src="https://your-tracker-domain.com/tracker.js" data-endpoint="https://your-tracker-domain.com/api/track"></script>
 *
 * The script auto-detects QR attribution from URL params (qr, pid, cid).
 *
 * Usage:
 *   // Auto-tracks landing_page_view on load
 *   // Manual tracking:
 *   window.qrTrack('cta_click', { button: 'apply-now' });
 *   window.qrTrack('form_start');
 *   window.qrTrack('form_submit', { form: 'registration' });
 *   window.qrTrack('file_download', { file: 'info.pdf' });
 */
(function () {
  'use strict';

  var script = document.currentScript;
  var endpoint = script && script.getAttribute('data-endpoint');
  if (!endpoint) {
    // Default: same origin
    endpoint = window.location.origin + '/api/track';
  }

  var params = new URLSearchParams(window.location.search);
  var qrCode = params.get('qr') || null;
  var placementId = params.get('pid') || null;
  var campaignId = params.get('cid') || null;

  // Simple session ID (per-tab)
  var sessionId = 'ses_' + Math.random().toString(36).substr(2, 12);

  function send(eventType, metadata) {
    var payload = {
      event_type: eventType,
      session_id: sessionId,
      page_url: window.location.href,
      metadata: metadata || {},
    };
    if (qrCode) payload.qr_code_id = qrCode;
    if (placementId) payload.placement_id = placementId;
    if (campaignId) payload.campaign_id = campaignId;

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, JSON.stringify(payload));
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', endpoint, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(payload));
    }
  }

  // Auto-track page view
  send('landing_page_view');

  // Expose global tracking function
  window.qrTrack = function (eventType, metadata) {
    send(eventType, metadata);
  };
})();
