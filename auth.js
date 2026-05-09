const API = "http://localhost:3000/api/auth";

// ===== LẤY DOM =====
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");

const registerUsername = document.getElementById("registerUsername");
const registerPassword = document.getElementById("registerPassword");


// ===== CHUYỂN FORM =====
showRegister.onclick = () => {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
};

showLogin.onclick = () => {
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
};


// ===== REGISTER =====
registerForm.onsubmit = async (e) => {
    e.preventDefault();

    let username = registerUsername.value;
    let password = registerPassword.value;

    try {
        let res = await fetch(API + "/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        let data = await res.json();

        alert(data.message);

        // 🔥 CHUYỂN SANG LOGIN
        if (data.message === "Đăng ký thành công") {
            registerForm.reset();

            registerForm.classList.add("hidden");
            loginForm.classList.remove("hidden");
        }

    } catch (err) {
        alert("Lỗi kết nối server");
    }
};


// ===== LOGIN =====
loginForm.onsubmit = async (e) => {
    e.preventDefault();

    let username = loginUsername.value;
    let password = loginPassword.value;

    try {
        let res = await fetch(API + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        let data = await res.json();

        if (data.user) {
            localStorage.setItem("currentUser", JSON.stringify(data.user));

            alert("Đăng nhập thành công");

            // 🔥 CHUYỂN TRANG
            window.location.href = "index.html";
        } else {
            alert(data.message);
        }

    } catch (err) {
        alert("Lỗi server");
    }
};