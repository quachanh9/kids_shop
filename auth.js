const API = "http://localhost:3000/api/auth";

// ===== DOM =====
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const registerUsername = document.getElementById("registerUsername");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const confirmPassword = document.getElementById("confirmPassword");


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
    let email = registerEmail.value;
    let password = registerPassword.value;
    let confirmPw = confirmPassword.value;

    // check confirm password
    if (password !== confirmPw) {
        alert("Mật khẩu xác nhận không khớp");
        return;
    }

    try {
        let res = await fetch(API + "/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
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

    let email = loginEmail.value;
    let password = loginPassword.value;

    try {
        let res = await fetch(API + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        let data = await res.json();

        if (data.user) {
            localStorage.setItem("currentUser", JSON.stringify(data.user));

            alert("Đăng nhập thành công");

            window.location.href = "index.html";
        } else {
            alert(data.message);
        }

    } catch (err) {
        alert("Lỗi server");
    }
};