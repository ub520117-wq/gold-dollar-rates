/* Live rates for Gold & Dollar Rates Pakistan.
   Gold:  primary https://api.gold-api.com/price/XAU (XAU/USD per troy oz)
          fallback https://latest.currency-api.pages.dev/v1/currencies/xau.json
   FX:    primary https://open.er-api.com/v6/latest/USD (rates per 1 USD)
          fallback https://latest.currency-api.pages.dev/v1/currencies/usd.json
   Gold math: 1 tola = 11.6638 g = 0.375 troy oz.
   Per-tola 24K PKR = XAU_USD x USD_PKR x 0.375. 22K = 24K x 22/24, 21K = 24K x 21/24.
   No rate is hardcoded: if every source fails, the page says so plainly. */
(function () {
  "use strict";
  var GOLD_PRIMARY = "https://api.gold-api.com/price/XAU";
  var GOLD_FALLBACK = "https://latest.currency-api.pages.dev/v1/currencies/xau.json";
  var FX_PRIMARY = "https://open.er-api.com/v6/latest/USD";
  var FX_FALLBACK = "https://latest.currency-api.pages.dev/v1/currencies/usd.json";
  var TOLA_G = 11.6638, TOLA_OZ = 0.375;
  var state = { xauUsd: null, fx: null, goldUpdated: "", fxUpdated: "" };

  function $(s) { return document.querySelector(s); }
  function $all(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function fmtInt(n) { return Math.round(n).toLocaleString("en-US"); }
  function fmt2(n) { return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmtPKR(n) { return "Rs " + fmtInt(n); }
  function fmtTime(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " PKT";
  }
  function getJSON(url, ms) {
    return new Promise(function (resolve, reject) {
      var ctl = new AbortController();
      var t = setTimeout(function () { ctl.abort(); }, ms || 12000);
      fetch(url, { signal: ctl.signal }).then(function (r) {
        clearTimeout(t);
        if (!r.ok) return reject(new Error("HTTP " + r.status));
        return r.json().then(resolve, reject);
      }).catch(function (e) { clearTimeout(t); reject(e); });
    });
  }
  function loadGold() {
    return getJSON(GOLD_PRIMARY).then(function (d) {
      if (!d || typeof d.price !== "number") throw new Error("bad gold payload");
      state.xauUsd = d.price;
      state.goldUpdated = d.updatedAt || d.updatedAtReadable || "";
      state.goldSource = "gold-api.com";
    }).catch(function () {
      return getJSON(GOLD_FALLBACK).then(function (d) {
        if (!d || !d.xau || typeof d.xau.usd !== "number") throw new Error("bad gold fallback");
        state.xauUsd = d.xau.usd;
        state.goldUpdated = d.date || "";
        state.goldSource = "currency-api.pages.dev";
      });
    });
  }
  function loadFX() {
    return getJSON(FX_PRIMARY).then(function (d) {
      if (!d || d.result !== "success" || !d.rates || typeof d.rates.PKR !== "number") throw new Error("bad fx payload");
      state.fx = d.rates;
      state.fxUpdated = d.time_last_update_utc || "";
      state.fxSource = "open.er-api.com";
    }).catch(function () {
      return getJSON(FX_FALLBACK).then(function (d) {
        if (!d || !d.usd || typeof d.usd.pkr !== "number") throw new Error("bad fx fallback");
        var u = d.usd, out = {};
        Object.keys(u).forEach(function (k) { out[k.toUpperCase()] = u[k]; });
        state.fx = out;
        state.fxUpdated = d.date || "";
        state.fxSource = "currency-api.pages.dev";
      });
    });
  }
  function gold() {
    var usdPkr = state.fx.PKR;
    var tola24 = state.xauUsd * usdPkr * TOLA_OZ;
    return {
      tola24: tola24, tola22: tola24 * 22 / 24, tola21: tola24 * 21 / 24,
      g24: tola24 / TOLA_G, g22: tola24 * 22 / 24 / TOLA_G, g21: tola24 * 21 / 24 / TOLA_G,
      ozPkr: state.xauUsd * usdPkr
    };
  }
  function toPkr(code) { // 1 unit of currency -> PKR
    if (code === "PKR") return 1;
    return state.fx.PKR / state.fx[code];
  }
  function render() {
    var g = gold(), usdPkr = state.fx.PKR;
    var vals = {
      "xau-usd": "$" + fmt2(state.xauUsd),
      "xau-usd-num": fmt2(state.xauUsd),
      "usd-pkr": fmtPKR(usdPkr), "usd-pkr-num": fmt2(usdPkr),
      "eur-pkr": fmtPKR(toPkr("EUR")), "eur-pkr-num": fmt2(toPkr("EUR")),
      "gbp-pkr": fmtPKR(toPkr("GBP")), "gbp-pkr-num": fmt2(toPkr("GBP")),
      "aed-pkr": fmtPKR(toPkr("AED")), "aed-pkr-num": fmt2(toPkr("AED")),
      "sar-pkr": fmtPKR(toPkr("SAR")), "sar-pkr-num": fmt2(toPkr("SAR")),
      "inr-pkr": fmtPKR(toPkr("INR")), "inr-pkr-num": fmt2(toPkr("INR")),
      "gold-oz-pkr": fmtPKR(g.ozPkr),
      "gold-tola-24k": fmtPKR(g.tola24), "gold-tola-22k": fmtPKR(g.tola22), "gold-tola-21k": fmtPKR(g.tola21),
      "gold-10g-24k": fmtPKR(g.g24 * 10), "gold-10g-22k": fmtPKR(g.g22 * 10), "gold-10g-21k": fmtPKR(g.g21 * 10),
      "gold-gram-24k": fmtPKR(g.g24), "gold-gram-22k": fmtPKR(g.g22), "gold-gram-21k": fmtPKR(g.g21)
    };
    $all("[data-rate]").forEach(function (el) {
      var k = el.getAttribute("data-rate");
      if (vals[k] !== undefined) el.textContent = vals[k];
    });
    $all("[data-rate-amt]").forEach(function (el) {
      var parts = el.getAttribute("data-rate-amt").split(":");
      var code = parts[0], amt = parseFloat(parts[1]);
      if (!isFinite(amt)) return;
      if (code === "XAU") { el.textContent = fmtPKR(state.xauUsd * state.fx.PKR * amt); return; }
      el.textContent = fmtPKR(toPkr(code) * amt);
    });
    var gu = fmtTime(state.goldUpdated), fu = fmtTime(state.fxUpdated);
    $all("[data-updated='gold']").forEach(function (el) { el.textContent = gu || "just now"; });
    $all("[data-updated='fx']").forEach(function (el) { el.textContent = fu || "today"; });
    $all("[data-updated='both']").forEach(function (el) { el.textContent = (gu || fu || "today"); });
    $all("[data-source='gold']").forEach(function (el) { el.textContent = state.goldSource || ""; });
    $all("[data-source='fx']").forEach(function (el) { el.textContent = state.fxSource || ""; });
    initConverters(g);
  }
  function fail(err) {
    $all(".rate-error").forEach(function (el) { el.classList.add("show"); });
    $all("[data-rate]").forEach(function (el) { el.textContent = "—"; });
    $all("[data-rate-amt]").forEach(function (el) { el.textContent = "—"; });
    $all("[data-c='out']").forEach(function (el) { el.textContent = "—"; });
    $all("[data-c='note']").forEach(function (el) { el.textContent = "Live rates unavailable — converters will work once rates load."; });
    if (window.console) console.warn("rates failed:", err);
  }
  function convRate(from, to) {
    if (from === to) return 1;
    if (from === "USD") return state.fx[to];
    if (to === "USD") return 1 / state.fx[from];
    return state.fx[to] / state.fx[from];
  }
  function initConverters(g) {
    $all("[data-converter='fx']").forEach(function (box) {
      var amt = box.querySelector("[data-c='amount']"), from = box.querySelector("[data-c='from']"),
          to = box.querySelector("[data-c='to']"), out = box.querySelector("[data-c='out']"),
          note = box.querySelector("[data-c='note']");
      if (!amt || !from || !to || !out) return;
      function run() {
        var a = parseFloat(amt.value);
        if (!isFinite(a) || a < 0) { out.textContent = "—"; if (note) note.textContent = ""; return; }
        var r = convRate(from.value, to.value), v = a * r;
        out.textContent = fmt2(v) + " " + to.value;
        if (note) note.textContent = "1 " + from.value + " = " + fmt2(r) + " " + to.value + " (live rate)";
      }
      ["input", "change"].forEach(function (ev) {
        amt.addEventListener(ev, run); from.addEventListener(ev, run); to.addEventListener(ev, run);
      });
      run();
    });
    $all("[data-converter='gold']").forEach(function (box) {
      var amt = box.querySelector("[data-c='amount']"), unit = box.querySelector("[data-c='unit']"),
          pur = box.querySelector("[data-c='purity']"), out = box.querySelector("[data-c='out']"),
          note = box.querySelector("[data-c='note']");
      if (!amt || !unit || !pur || !out) return;
      function run() {
        var a = parseFloat(amt.value);
        if (!isFinite(a) || a < 0) { out.textContent = "—"; if (note) note.textContent = ""; return; }
        var grams = unit.value === "tola" ? a * TOLA_G : unit.value === "10g" ? a * 10 : unit.value === "oz" ? a * 31.1035 : a;
        var perGram = pur.value === "22k" ? g.g22 : pur.value === "21k" ? g.g21 : g.g24;
        out.textContent = fmtPKR(grams * perGram);
        if (note) note.textContent = fmt2(grams) + " g of " + pur.value.toUpperCase() + " gold at " + fmtPKR(perGram) + " per gram";
      }
      ["input", "change"].forEach(function (ev) {
        amt.addEventListener(ev, run); unit.addEventListener(ev, run); pur.addEventListener(ev, run);
      });
      run();
    });
  }
  function init() {
    Promise.all([loadGold(), loadFX()]).then(render).catch(fail);
  }
  $all("[data-action='refresh-rates']").forEach(function (btn) {
    btn.addEventListener("click", function () {
      $all(".rate-error").forEach(function (el) { el.classList.remove("show"); });
      $all("[data-rate]").forEach(function (el) { el.textContent = "Loading…"; });
      init();
    });
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
