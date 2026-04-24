const API_BASE = 'http://localhost:5000';
const HISTORY_KEY = 'factCheckerHistory';

// LocalStorage Credit System
const CREDITS_KEY = 'factCheckerCredits';
let currentCredits = parseInt(localStorage.getItem(CREDITS_KEY));

function initLocalCredits() {
    if (isNaN(currentCredits)) {
        currentCredits = 10000; // New users get 100 free credits
        localStorage.setItem(CREDITS_KEY, currentCredits);
    }
    updateCreditDisplay();
}

// DOM Elements
const queryInput = document.getElementById('queryInput');
const searchBtn = document.getElementById('searchBtn');
const errorBox = document.getElementById('errorBox');
const errorText = document.getElementById('errorText');

const loadingView = document.getElementById('loadingView');
const resultsDashboard = document.getElementById('resultsDashboard');
const landingSection = document.getElementById('landingSection');
const historyView = document.getElementById('historyView');
const pricingView = document.getElementById('pricingView');
const reviewsView = document.getElementById('reviewsView');
const appFooter = document.querySelector('.app-footer');

const creditCountDisplay = document.getElementById('creditCount');
const themeToggleBtn = document.getElementById('themeToggleBtn');

// Theme Management
let isLightMode = localStorage.getItem('theme') === 'light';
if (isLightMode) {
    document.body.classList.add('light-theme');
    themeToggleBtn.textContent = '☀️';
} else {
    themeToggleBtn.textContent = '🌙';
}

themeToggleBtn.addEventListener('click', () => {
    isLightMode = !isLightMode;
    if (isLightMode) {
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
        themeToggleBtn.textContent = '☀️';
    } else {
        document.body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
        themeToggleBtn.textContent = '🌙';
    }
});


// Nav Tabs
const navHome = document.getElementById('navHome');
const navHistory = document.getElementById('navHistory');
const navPricing = document.getElementById('navPricing');
const navReviews = document.getElementById('navReviews');

// Side Chat Elements
const chatSidebar = document.getElementById('chatSidebar');
const closeChatBtn = document.getElementById('closeChatBtn');
const launchChatBtn = document.getElementById('launchChatBtn');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const chatHistoryContainer = document.getElementById('chatHistory');

// Event Listeners
searchBtn.addEventListener('click', performSearch);
queryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !searchBtn.disabled) {
        performSearch();
    }
});

navHome.addEventListener('click', () => switchTab('home'));
navHistory.addEventListener('click', () => switchTab('history'));
navPricing.addEventListener('click', () => switchTab('pricing'));
navReviews.addEventListener('click', () => switchTab('reviews'));


closeChatBtn.addEventListener('click', () => {
    chatSidebar.classList.remove('open');
});

launchChatBtn.addEventListener('click', () => {
    chatSidebar.classList.add('open');
    chatInput.focus();
});

sendChatBtn.addEventListener('click', sendChat);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChat();
});

// App Startup
loadNewsTicker();
initLocalCredits();

// Navigation Logic
function switchTab(tab) {
    hideError();
    // Hide all
    landingSection.style.display = 'none';
    historyView.style.display = 'none';
    pricingView.style.display = 'none';
    reviewsView.style.display = 'none';
    resultsDashboard.style.display = 'none';
    loadingView.style.display = 'none';
    appFooter.classList.remove('hidden-footer');

    // Deselect all nav tabs
    navHome.classList.remove('active');
    navHistory.classList.remove('active');
    navPricing.classList.remove('active');
    navReviews.classList.remove('active');

    if (tab === 'home') {
        navHome.classList.add('active');
        landingSection.style.display = 'flex';
    } else if (tab === 'history') {
        navHistory.classList.add('active');
        historyView.style.display = 'block';
        renderHistory();
    } else if (tab === 'pricing') {
        navPricing.classList.add('active');
        pricingView.style.display = 'block';
    } else if (tab === 'reviews') {
        navReviews.classList.add('active');
        reviewsView.style.display = 'block';
        loadReviews();
    }
}



// Search Logic
async function performSearch() {

    if (currentCredits < 10) {
        showError('Insufficient credits! You need 10 credits to perform an analysis.');
        switchTab('pricing');
        return;
    }

    const query = queryInput.value.trim();
    if (!query) {
        showError('Please enter a claim to verify.');
        return;
    }

    hideError();
    // Setup UI for Loading
    landingSection.style.display = 'none';
    resultsDashboard.style.display = 'none';
    loadingView.style.display = 'flex';
    appFooter.classList.add('hidden-footer'); // Hide footer when loading

    searchBtn.disabled = true;
    queryInput.disabled = true;

    searchBtn.disabled = true;
    queryInput.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/api/fact-check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Server error.');
        }

        const data = await response.json();
        saveToHistory(query, data);
        await deductCredits(10); // Deduct 10 credits for a search
        renderResults(data, query);
    } catch (err) {
        showError(err.message || 'Failed connecting to backend API (http://localhost:5000).');
        landingSection.style.display = 'flex';
        loadingView.style.display = 'none';
        appFooter.classList.remove('hidden-footer');
    } finally {
        searchBtn.disabled = false;
        queryInput.disabled = false;
    }
}

// History Management
function saveToHistory(query, resultData) {
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    history.unshift({
        id: Date.now(),
        query,
        verdict: resultData.verdict,
        date: new Date().toISOString()
    });
    // keep last 50
    if (history.length > 50) history.length = 50;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function renderHistory() {
    const historyGrid = document.getElementById('historyGrid');
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

    if (history.length === 0) {
        historyGrid.innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1; text-align:center;">No verification history found.</p>';
        return;
    }

    historyGrid.innerHTML = history.map(item => {
        const d = new Date(item.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
        const isReal = item.verdict === 'Real';
        return `
            <div class="history-card">
                <div class="h-date">${d}</div>
                <div class="h-query">${item.query}</div>
                <div class="h-verdict ${isReal ? 'real' : 'cap'}">${isReal ? '✅ Real' : '❌ Cap'}</div>
            </div>
        `;
    }).join('');
}

function renderResults(data, query) {
    loadingView.style.display = 'none';
    appFooter.classList.remove('hidden-footer'); // Show footer again
    resultsDashboard.style.display = 'block';

    // Populate Query
    document.getElementById('userQueryDisplay').textContent = query;

    // Verdict
    const isReal = data.verdict === 'Real';
    const vBanner = document.getElementById('verdictBanner');
    vBanner.className = `verdict-banner ${isReal ? 'real' : 'cap'}`;
    vBanner.innerHTML = `
        <div class="v-icon">${isReal ? '✅' : '❌'}</div>
        <div class="v-text">${data.verdict}</div>
    `;

    // Confidence
    const conf = data.confidence || 0;
    const confColor = conf > 75 ? 'var(--success-green)' : conf > 45 ? 'var(--warning-yellow)' : 'var(--danger-red)';
    document.getElementById('confValue').textContent = `${conf}%`;
    document.getElementById('confValue').style.color = confColor;
    document.getElementById('confFill').style.width = `${conf}%`;
    document.getElementById('confFill').style.backgroundColor = confColor;

    // Explanation
    document.getElementById('expText').innerHTML = data.explanation.replace(/\n/g, '<br>');

    // Citations
    const citations = data.citations || [];
    const citationsHtml = citations.length > 0
        ? citations.map(c => {
            const domain = new URL(c).hostname.replace('www.', '');
            return `
                <a href="${c}" target="_blank" class="source-link">
                    <span style="font-size: 1.5rem">🌐</span>
                    <div style="min-width:0; flex:1">
                        <div class="s-host">${domain}</div>
                        <div class="s-url">${c}</div>
                    </div>
                </a>
            `;
        }).join('')
        : '<p style="color:var(--text-muted)">No direct citations found.</p>';
    document.getElementById('citationsList').innerHTML = citationsHtml;

    // Store Witness for Chat context
    let witnessText = data.witness || '';
    if (!witnessText && data.searchResults && data.searchResults.length) {
        witnessText = data.searchResults.map(r => `Title: ${r.title}\n${r.content}`).join('\n');
    }

    if (witnessText) {
        window.currentWitnessContext = witnessText;
        launchChatBtn.style.display = 'flex';
    } else {
        launchChatBtn.style.display = 'none';
    }

    // Reset Chat
    window.chatHistoryParams = [];
    chatHistoryContainer.innerHTML = '';
}

// Global Chat state
window.currentWitnessContext = '';
window.chatHistoryParams = [];

async function sendChat() {

    if (currentCredits < 5) {
        appendBubble('assistant', 'Error: Insufficient credits. Every witness interrogation costs 5 credits.');
        return;
    }

    const q = chatInput.value.trim();
    if (!q) return;

    chatInput.value = '';
    appendBubble('user', q);

    window.chatHistoryParams.push({ role: 'user', content: q });

    try {
        const res = await fetch(`${API_BASE}/api/witness-chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ witness: window.currentWitnessContext, history: window.chatHistoryParams }),
        });
        const data = await res.json();
        if (data.success) {
            await deductCredits(5); // Deduct 5 credits for an interrogation
            appendBubble('assistant', data.reply);
            window.chatHistoryParams.push({ role: 'assistant', content: data.reply });
        } else {
            appendBubble('assistant', `Error: ${data.error}`);
        }
    } catch {
        appendBubble('assistant', '*Connection error connecting to witness base.*');
    }
}

function appendBubble(role, text) {
    const div = document.createElement('div');
    div.className = `bubble ${role}`;

    // Highlight entities
    let safeText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    div.innerHTML = safeText;
    chatHistoryContainer.appendChild(div);
    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
}

function showError(msg) {
    errorText.textContent = msg;
    errorBox.style.display = 'flex';
}
function hideError() {
    errorBox.style.display = 'none';
}

// Live News Ticker Fetcher
async function loadNewsTicker() {
    const marquee = document.getElementById('newsMarquee');
    try {
        const res = await fetch(`${API_BASE}/api/news`);
        const data = await res.json();
        if (data.success && data.articles.length > 0) {
            marquee.innerHTML = data.articles.map(a => `<a href="${a.url}" target="_blank">📰 ${a.title}</a>`).join('');
            // duplicate for seamless scroll
            marquee.innerHTML += marquee.innerHTML;
        } else {
            marquee.innerHTML = '<span style="color:var(--text-muted)">Unable to fetch live intelligence feed...</span>';
        }
    } catch {
        marquee.innerHTML = '<span style="color:var(--text-muted)">Live intelligence feed disconnected...</span>';
    }
}


// ==========================================
// 🗞️ THREE.JS BACKGROUND (NEWSPAPER SCANNER)
// ==========================================
(function initDataStream() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 0, 150);

    const docGroup = new THREE.Group();
    scene.add(docGroup);

    // Create a procedural "newspaper text" texture on a 2D canvas
    const textCanvas = document.createElement('canvas');
    textCanvas.width = 256;
    textCanvas.height = 512;
    const ctx = textCanvas.getContext('2d');

    // Background paper color
    ctx.fillStyle = '#fdfcf0';
    ctx.fillRect(0, 0, 256, 512);

    // Fake text headers
    ctx.fillStyle = '#111111';
    ctx.fillRect(20, 30, 160, 20); // main title
    ctx.fillRect(20, 60, 100, 10); // subtitle

    // Fake text lines
    ctx.fillStyle = '#666666';
    for (let y = 90; y < 480; y += 14) {
        let width = 160 + Math.random() * 50;
        if (Math.random() > 0.8) width -= 100; // Half line
        ctx.fillRect(20, y, width, 5);
    }

    // Convert to a Three.js material
    const docTexture = new THREE.CanvasTexture(textCanvas);
    const docMaterial = new THREE.MeshBasicMaterial({
        map: docTexture,
        transparent: true,
        opacity: 0.15, // dim so it sits in the background
        side: THREE.DoubleSide
    });

    const docGeometry = new THREE.PlaneGeometry(30, 60);

    const documents = [];
    // Spawn several scrolling document planes
    for (let i = 0; i < 25; i++) {
        const doc = new THREE.Mesh(docGeometry, docMaterial);

        doc.position.set(
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 300,
            (Math.random() - 0.5) * 100 - 40
        );

        // Give them an upward scroll speed
        doc.userData = {
            vy: 0.3 + Math.random() * 0.4
        };

        docGroup.add(doc);
        documents.push(doc);
    }

    // Horizontal Scanning Laser
    const laserGeo = new THREE.PlaneGeometry(300, 1.5);
    const laserMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const laser = new THREE.Mesh(laserGeo, laserMat);
    laser.position.z = 10;
    scene.add(laser);

    function resize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    let scanDir = -1;

    function animate() {
        requestAnimationFrame(animate);

        // Check if theme changed to update the laser color
        if (document.body.classList.contains('light-theme')) {
            laser.material.color.setHex(0x0284c7); // light mode primary blue
            docMaterial.opacity = 0.4;
        } else {
            laser.material.color.setHex(0x00f0ff); // dark mode cyan
            docMaterial.opacity = 0.15;
        }

        // Scroll documents up simulating a feed
        documents.forEach(doc => {
            doc.position.y += doc.userData.vy;
            if (doc.position.y > 150) {
                doc.position.y = -150; // Reset below
                doc.position.x = (Math.random() - 0.5) * 200;
            }
        });

        // Move scanner beam up and down
        laser.position.y += scanDir * 1.2;
        if (laser.position.y > 100) scanDir = -1;
        if (laser.position.y < -100) scanDir = 1;

        // Pulse the laser opacity slightly
        laser.material.opacity = 0.4 + Math.sin(Date.now() * 0.005) * 0.4;

        renderer.render(scene, camera);
    }
    animate();
})();

// ==========================================
// 🛡️ LOCAL CREDITS SYSTEM
// ==========================================

async function deductCredits(amount) {
    currentCredits = Math.max(0, currentCredits - amount);
    localStorage.setItem(CREDITS_KEY, currentCredits);
    updateCreditDisplay();
}

function updateCreditDisplay() {
    if (creditCountDisplay) {
        creditCountDisplay.innerText = currentCredits;
        if (currentCredits < 15) {
            creditCountDisplay.style.color = "var(--danger-red)";
        } else {
            creditCountDisplay.style.color = "var(--primary-neon)";
        }
    }
}

// ==========================================
// ⭐ REVIEWS SYSTEM
// ==========================================

const starRatingContainer = document.getElementById('starRatingContainer');
const stars = document.querySelectorAll('.star');
const reviewPreMessage = document.getElementById('reviewPreMessage');
const reviewText = document.getElementById('reviewText');
const submitReviewBtn = document.getElementById('submitReviewBtn');
const reviewsGrid = document.getElementById('reviewsGrid');
const bubbleContainer = document.getElementById('bubbleContainer');
let currentRating = 0;

const preMessages = [
    "Rate to unlock insight...",
    "1 Star - Pure Cap?",
    "2 Stars - Hmm...",
    "3 Stars - Average Check",
    "4 Stars - Solid Intel",
    "5 Stars - Absolute Truth!"
];

if (stars.length > 0) {
    stars.forEach(star => {
        star.addEventListener('click', () => {
            currentRating = parseInt(star.getAttribute('data-value'));
            updateStars(currentRating);
            reviewPreMessage.textContent = preMessages[currentRating];
            reviewPreMessage.style.color = "var(--primary-neon)";
        });
        
        star.addEventListener('mouseenter', () => {
            const hoverVal = parseInt(star.getAttribute('data-value'));
            updateStars(hoverVal);
        });
        
        star.addEventListener('mouseleave', () => {
            updateStars(currentRating);
        });
    });
}

function updateStars(val) {
    stars.forEach(s => {
        const sVal = parseInt(s.getAttribute('data-value'));
        if (sVal <= val) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });
}

function spawnBubbles() {
    if (!bubbleContainer) return;
    for (let i = 0; i < 15; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'flying-bubble';
        const size = Math.random() * 20 + 10;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        
        // Random trajectory
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 150 + 50;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance - 100; // Prefer upward
        
        bubble.style.setProperty('--tx', `${tx}px`);
        bubble.style.setProperty('--ty', `${ty}px`);
        
        bubbleContainer.appendChild(bubble);
        
        // Remove after animation (1.5s)
        setTimeout(() => bubble.remove(), 1500);
    }
}

if (submitReviewBtn) {
    submitReviewBtn.addEventListener('click', async () => {
        const text = reviewText.value.trim();
        if (currentRating === 0) {
            showError("Please select a star rating.");
            return;
        }
        if (!text) {
            showError("Please write a review.");
            return;
        }
        
        submitReviewBtn.disabled = true;
        spawnBubbles();
        
        try {
            const res = await fetch(`${API_BASE}/api/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: currentRating, text: text })
            });
            const data = await res.json();
            
            if (data.success) {
                reviewText.value = '';
                currentRating = 0;
                updateStars(0);
                reviewPreMessage.textContent = "Review posted! Thank you.";
                reviewPreMessage.style.color = "var(--success-green)";
                loadReviews(); // Refresh list
            } else {
                showError(data.error || "Failed to post review.");
            }
        } catch (err) {
            showError("Network error. Unable to post.");
        } finally {
            submitReviewBtn.disabled = false;
        }
    });
}

async function loadReviews() {
    try {
        const res = await fetch(`${API_BASE}/api/reviews`);
        const data = await res.json();
        if (data.success && data.reviews) {
            renderReviewCards(data.reviews);
        }
    } catch (err) {
        console.error("Failed loading reviews:", err);
    }
}

function renderReviewCards(reviews) {
    if (!reviewsGrid) return;
    if (reviews.length === 0) {
        reviewsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No reviews yet. Be the first!</p>';
        return;
    }
    
    reviewsGrid.innerHTML = reviews.map(r => {
        const d = new Date(r.date).toLocaleDateString();
        const starsHtml = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
        return `
            <div class="review-card">
                <div class="r-header">
                    <span class="r-stars">${starsHtml}</span>
                    <span class="r-date">${d}</span>
                </div>
                <div class="r-text">${r.text.replace(/</g, "&lt;")}</div>
            </div>
        `;
    }).join("");
}
