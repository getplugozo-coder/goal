const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTA1AfMuoKpNaNWmGvHet37YlVYE1ozZQt43OGy9bjNd-9a7YiHyKf2xp3MHzf_WoAagroiGceF1co/pub?output=csv';
let matchesData = [];

async function loadMatches() {
    try {
        const res = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(SHEET_URL));
        const data = await res.text();
        const rows = data.split(/\r?\n/).slice(1);
        matchesData = rows.map(row => {
            const c = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            const cl = (v) => v ? v.replace(/^"|"$/g, '').trim() : "";
            return { t1: cl(c[0]), l1: cl(c[1]), t2: cl(c[2]), l2: cl(c[3]), time: cl(c[4]), links: [cl(c[5]), cl(c[6])] };
        }).filter(m => m.t1);
        displayMatches();
    } catch (e) { console.error(e); }
}

function displayMatches() {
    const grid = document.getElementById('match-grid');
    grid.innerHTML = matchesData.map((m, i) => `
        <div class="match-card" onclick="openAdOverlay(${i})">
            <div style="display:flex; justify-content:space-around; align-items:center;">
                <div class="team"><img src="${m.l1}" width="40"><br>${m.t1}</div>
                <div style="color:var(--orange); font-weight:bold;">VS</div>
                <div class="team"><img src="${m.l2}" width="40"><br>${m.t2}</div>
            </div>
            <center><div style="font-size:11px; color:#8b949e; margin-top:10px;">${m.time}</div></center>
        </div>
    `).join('');
}

function openAdOverlay(idx) {
    const overlay = document.getElementById('global-ad-overlay');
    const skipBtn = document.getElementById('skip-btn');
    const timerText = document.getElementById('ad-timer');
    
    overlay.style.display = 'flex';
    let count = 10;
    skipBtn.disabled = true;
    skipBtn.innerText = "جاري التحميل...";

    const timer = setInterval(() => {
        count--;
        timerText.innerText = count;
        if(count <= 0) {
            clearInterval(timer);
            skipBtn.disabled = false;
            skipBtn.innerText = "مشاهدة المباراة الآن";
            skipBtn.onclick = () => {
                overlay.style.display = 'none';
                showPlayer(idx);
            };
        }
    }, 1000);
}

function showPlayer(idx) {
    const m = matchesData[idx];
    const section = document.getElementById('player-section');
    section.style.display = 'block';
    document.getElementById('current-match-title').innerText = `${m.t1} VS ${m.t2}`;
    
    const validLinks = m.links.filter(l => l && l !== "");
    const srvBox = document.getElementById('server-list');
    srvBox.innerHTML = validLinks.map((l, i) => 
        `<button class="srv-btn" style="background:#333; color:white; border:none; padding:8px 15px; margin:5px; border-radius:5px; cursor:pointer;" onclick="play('${l}')">سيرفر ${i+1}</button>`
    ).join('');

    play(validLinks[0]);
    section.scrollIntoView({ behavior: 'smooth' });
}

function play(url) {
    const v = document.getElementById('video-player');
    const f = document.getElementById('iframe-player');
    v.style.display = 'none'; f.style.display = 'none'; v.pause();
    
    if(url.includes('.m3u8') || url.includes('.mp4')) {
        v.style.display = 'block';
        if(Hls.isSupported()) {
            const hls = new Hls(); hls.loadSource(url); hls.attachMedia(v);
            hls.on(Hls.Events.MANIFEST_PARSED, () => v.play());
        } else { v.src = url; v.play(); }
    } else {
        f.style.display = 'block'; f.src = url;
    }
}

window.onload = loadMatches;