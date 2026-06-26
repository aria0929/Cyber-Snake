// 帳號與排行榜的 LocalStorage Key
const USERS_KEY = 'cyber_snake_users';
const LEADERBOARD_KEY = 'cyber_snake_leaderboard';

// 記憶體中暫存的當前使用者
let currentUser = null;

// 初始化帳號系統
function initAuth() {
    const authOverlay = document.getElementById('auth-overlay');
    const authForm = document.getElementById('auth-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const submitBtn = document.getElementById('submit-btn');
    const guestBtn = document.getElementById('guest-btn');
    const authMessage = document.getElementById('auth-message');
    const logoutBtn = document.getElementById('logout-btn');
    const displayUsername = document.getElementById('display-username');

    let currentTab = 'login'; // 'login' 或 'register'

    // 切換 Tab
    tabLogin.addEventListener('click', () => {
        currentTab = 'login';
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        submitBtn.textContent = '進入深淵';
        submitBtn.className = 'neon-btn neon-btn-pink';
        authMessage.textContent = '';
    });

    tabRegister.addEventListener('click', () => {
        currentTab = 'register';
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        submitBtn.textContent = '註冊帳號';
        submitBtn.className = 'neon-btn neon-btn-blue';
        authMessage.textContent = '';
    });

    // 提交表單
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            authMessage.textContent = '請填寫完整資訊';
            return;
        }

        if (currentTab === 'register') {
            const success = registerUser(username, password);
            if (success) {
                authMessage.style.color = '#00ffcc';
                authMessage.textContent = '註冊成功！已為您自動登入...';
                setTimeout(() => {
                    login(username);
                }, 1000);
            } else {
                authMessage.style.color = '#ff2e93';
                authMessage.textContent = '該用戶名稱已被註冊！';
            }
        } else {
            const success = verifyUser(username, password);
            if (success) {
                login(username);
            } else {
                authMessage.style.color = '#ff2e93';
                authMessage.textContent = '帳號或密碼錯誤！';
            }
        }
    });

    // 遊客登入
    guestBtn.addEventListener('click', () => {
        login(null);
    });

    // 登出按鈕
    logoutBtn.addEventListener('click', () => {
        logout();
    });

    // 檢查 Session
    const savedUser = sessionStorage.getItem('cyber_snake_current_user');
    if (savedUser) {
        if (savedUser === 'Guest') {
            login(null);
        } else {
            login(savedUser);
        }
    } else {
        authOverlay.classList.remove('hidden');
    }

    renderLeaderboard();
}

// 註冊帳號
function registerUser(username, password) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY)) || {};
    if (users[username]) {
        return false; // 已存在
    }
    users[username] = {
        password: password, // 單機版小遊戲，以明碼簡化儲存
        highScore: 0
    };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
}

// 驗證登入
function verifyUser(username, password) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY)) || {};
    if (!users[username]) return false;
    return users[username].password === password;
}

// 執行登入
function login(username) {
    const authOverlay = document.getElementById('auth-overlay');
    const displayUsername = document.getElementById('display-username');
    const personalHighVal = document.getElementById('personal-high');

    if (username) {
        currentUser = username;
        sessionStorage.setItem('cyber_snake_current_user', username);
        displayUsername.textContent = username;
        displayUsername.className = 'neon-text-blue';
        document.querySelector('.user-status').textContent = '傳奇冒險者';
        
        // 讀取個人最高紀錄
        const score = getPersonalHighScore();
        personalHighVal.textContent = String(score).padStart(3, '0');
    } else {
        currentUser = 'Guest';
        sessionStorage.setItem('cyber_snake_current_user', 'Guest');
        displayUsername.textContent = '遊客 (Guest)';
        displayUsername.className = 'neon-text-pink';
        document.querySelector('.user-status').textContent = '臨時冒險者';
        personalHighVal.textContent = '000';
    }

    // 隱藏登入層
    authOverlay.classList.add('hidden');
    if (document.activeElement) {
        document.activeElement.blur();
    }
    
    // 重設輸入框
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('auth-message').textContent = '';

    // 渲染排行榜
    renderLeaderboard();

    // 如果遊戲模組已經載入，重設遊戲狀態
    if (typeof resetGameOnLogin === 'function') {
        resetGameOnLogin();
    }
}

// 登出
function logout() {
    currentUser = null;
    sessionStorage.removeItem('cyber_snake_current_user');
    document.getElementById('auth-overlay').classList.remove('hidden');
    
    // 重設分數顯示
    document.getElementById('current-score').textContent = '000';
    document.getElementById('personal-high').textContent = '000';
}

// 獲取個人最高紀錄
function getPersonalHighScore() {
    if (!currentUser || currentUser === 'Guest') return 0;
    const users = JSON.parse(localStorage.getItem(USERS_KEY)) || {};
    return (users[currentUser] && users[currentUser].highScore) ? users[currentUser].highScore : 0;
}

// 更新最高紀錄與排行榜
function saveUserScore(score) {
    if (!currentUser || currentUser === 'Guest') return false; // 遊客不記錄至全域/個人榜

    const users = JSON.parse(localStorage.getItem(USERS_KEY)) || {};
    let isNewRecord = false;

    if (users[currentUser]) {
        if (score > users[currentUser].highScore) {
            users[currentUser].highScore = score;
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            isNewRecord = true;
            
            // 更新畫面的個人最高紀錄
            document.getElementById('personal-high').textContent = String(score).padStart(3, '0');
        }
    }

    // 更新排行榜
    updateLeaderboard(currentUser, score);
    return isNewRecord;
}

// 更新殿堂排行榜
function updateLeaderboard(username, score) {
    let leaderboard = JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
    
    // 尋找此用戶是否已在榜中
    const userIndex = leaderboard.findIndex(entry => entry.username === username);
    
    if (userIndex !== -1) {
        // 如果新分數比榜上的分數高，則更新
        if (score > leaderboard[userIndex].score) {
            leaderboard[userIndex].score = score;
        }
    } else {
        // 新增至排行榜
        leaderboard.push({ username, score });
    }

    // 排序（分數由大到小）
    leaderboard.sort((a, b) => b.score - a.score);

    // 只保留前 5 名
    leaderboard = leaderboard.slice(0, 5);

    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    renderLeaderboard();
}

// 渲染排行榜 UI
function renderLeaderboard() {
    const listEl = document.getElementById('leaderboard-list');
    if (!listEl) return;

    const leaderboard = JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];

    if (leaderboard.length === 0) {
        listEl.innerHTML = '<li class="empty-list">尚無挑戰紀錄</li>';
        return;
    }

    listEl.innerHTML = leaderboard.map((entry, index) => {
        const rank = index + 1;
        let rankClass = '';
        if (rank <= 3) {
            rankClass = `top-rank-${rank}`;
        }
        return `
            <li class="${rankClass}">
                <span class="rank">#${rank}</span>
                <span class="username">${escapeHTML(entry.username)}</span>
                <span class="score">${entry.score} 分</span>
            </li>
        `;
    }).join('');
}

// 防止 HTML 注入的安全函式
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// 網頁載入後初始化
window.addEventListener('DOMContentLoaded', () => {
    initAuth();
});
