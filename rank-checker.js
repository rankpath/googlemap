(() => {
  const form = document.getElementById("rankForm");
  const resultBox = document.getElementById("resultBox");
  const resultIntro = document.getElementById("resultIntro");
  const submitBtn = document.getElementById("submitBtn");
  const config = window.RANK_MAPS_CONFIG || {};
  const apiBase = String(config.API_BASE || "").replace(/\/+$/, "");

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function fallbackHtml() {
    return `
      <div class="error">
        <strong>Live Rank API ยังไม่ได้เชื่อมกับหน้าเว็บนี้</strong><br>
        ตัว Checker และ Backend พร้อมแล้ว แต่ต้องนำ API ขึ้น Vercel และใส่ API_BASE ก่อน
        <div class="fallback">
          <p>ระหว่างนี้ใช้เครื่องมือฟรีสำหรับเช็กอันดับได้ทันที:</p>
          <div class="fallback-links">
            <a href="https://getranklocal.com/tools/local-rank-checker" target="_blank" rel="noopener">RankLocal ↗</a>
            <a href="https://www.rank.ai/free-tools/geo-grid" target="_blank" rel="noopener">Rank.ai Geo Grid ↗</a>
            <a href="https://www.brightlocal.com/local-search-results-checker/" target="_blank" rel="noopener">BrightLocal ↗</a>
          </div>
        </div>
      </div>`;
  }

  function render(data) {
    const rankText = data.found && data.rank ? `#${data.rank}` : "Top 20";
    const rankClass = data.found ? "" : " not-found";
    const business = data.business || {};
    const competitors = Array.isArray(data.competitors) ? data.competitors.slice(0, 6) : [];

    const list = competitors.map(item => `
      <div class="comp">
        <div class="pos">${esc(item.rank || "–")}</div>
        <div>
          <b>${esc(item.title)}</b>
          <span>${esc(item.category || item.address || "")}</span>
        </div>
        <div class="rating">${item.rating ? `★ ${esc(item.rating)}` : ""}${item.reviews ? ` · ${esc(item.reviews)}` : ""}</div>
      </div>
    `).join("");

    resultIntro.textContent = `Keyword: ${data.keyword} · ${data.location}`;

    resultBox.className = "";
    resultBox.innerHTML = `
      <div class="rank-card${rankClass}">
        <div class="rank-no">${data.found ? esc(rankText) : "ไม่พบใน<br>Top 20"}</div>
        <div>
          <h3>${esc(data.found ? business.title : data.businessName)}</h3>
          <p>${esc(data.found ? (business.address || business.category || "") : "ยังไม่พบธุรกิจจากผล Google Maps 20 อันดับแรก")}</p>
          <p>${data.found && business.rating ? `Rating ${esc(business.rating)} · ${esc(business.reviews || 0)} reviews` : ""}</p>
        </div>
      </div>
      <div class="competitors">
        <h3>คู่แข่งที่พบในพื้นที่</h3>
        ${list || "<p>ยังไม่มีข้อมูลคู่แข่งในผลลัพธ์นี้</p>"}
      </div>
      <div class="note">${esc(data.note || "อันดับ Local Search เปลี่ยนตามตำแหน่ง เวลา ภาษา และอุปกรณ์")}</div>
    `;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!apiBase) {
      resultBox.className = "";
      resultBox.innerHTML = fallbackHtml();
      return;
    }

    const payload = Object.fromEntries(new FormData(form).entries());

    submitBtn.disabled = true;
    submitBtn.textContent = "กำลังเช็กอันดับ...";
    resultBox.className = "empty";
    resultBox.innerHTML = "<div><strong>กำลังดึงผล Google Maps</strong>ปกติใช้เวลาไม่กี่วินาที</div>";

    try {
      const response = await fetch(`${apiBase}/api/maps-rank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Rank check failed");
      render(data);
    } catch (error) {
      resultBox.className = "";
      resultBox.innerHTML = `<div class="error"><strong>เช็กอันดับไม่สำเร็จ</strong><br>${esc(error.message)}${fallbackHtml()}</div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "เช็กอันดับ Google Maps ฟรี";
    }
  });
})();
