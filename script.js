const API = "http://localhost:3000";
let allProducts = [];

// === USER ===
// ===== USER LOGIN =====
const userData = localStorage.getItem("currentUser");

const welcomeUser =
    document.getElementById("welcomeUser") ||
    document.getElementById("userName");

const logoutBtn =
    document.getElementById("logoutBtn") ||
    document.querySelector(".logout-btn");

if (welcomeUser) {

    if (userData) {

        const user = JSON.parse(userData);

        welcomeUser.innerText = "Xin chào, " + user.username;

        if (logoutBtn) {
            logoutBtn.innerText = "Đăng xuất";

            logoutBtn.onclick = () => {
                localStorage.removeItem("currentUser");
                window.location.href = "index.html";
            };
        }

    } else {

        welcomeUser.innerText = "Xin chào";

        if (logoutBtn) {
            logoutBtn.innerText = "Đăng nhập";

            logoutBtn.onclick = () => {
                window.location.href = "auth.html";
            };
        }
    }
}

// === LOAD PRODUCTS ===
async function loadProducts() {
    let res = await fetch(API + "/products");
    let products = await res.json();    
    allProducts = products;

// 🔥 THÊM ĐOẠN NÀY (SEARCH ENTER)
let keyword = localStorage.getItem("searchKeyword");

if (keyword) {
    products = products.filter(p =>
        p.name.toLowerCase().includes(keyword.toLowerCase())
    );

    // 🔥 xoá sau khi dùng
    localStorage.removeItem("searchKeyword");
}

    // ===== TRANG PRODUCT (HIỆN FULL) =====
    let container = document.getElementById("product-container");
    if (container) {
        container.innerHTML = "";

        products.forEach(p => {
            container.innerHTML += `
                <div class="product">
                    <img src="http://localhost:3000/uploads/${p.image}">
                    <h3>${p.name}</h3>
                    <p class="price">${Number(p.price).toLocaleString('vi-VN')}đ</p>
                    <button onclick="goDetail(${p.id})">Xem chi tiết</button>
                </div>
            `;
        });
    }

    // === HOME PRODUCT ===
    window.allHomeProducts = products;
    loadHomeProducts("random");
}

loadProducts();

// === DETAIL ===
function goDetail(id) {
    localStorage.setItem("detailId", id);
    window.location.href = "detail.html";
}

// === CART === 
async function addToCart() {
    try {
        const user = JSON.parse(localStorage.getItem("currentUser"));

        if (!user) {
            alert("Bạn cần đăng nhập!");
            window.location.href = "auth.html";
            return;
        }

        let quantity = document.getElementById("qty")
            ? parseInt(document.getElementById("qty").value)
            : 1;

        let product_id = localStorage.getItem("detailId");

        let res = await fetch("http://localhost:3000/cart", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: user.id,
                product_id,
                quantity
            })
        });

        let data = await res.json();

        console.log("RESP:", data); // 🔥 debug

        if (data.error) {
            alert("Lỗi: " + data.error);
        } else {
            alert(data.message || "Đã thêm vào giỏ!");
        }

    } catch (err) {
        console.error(err);
        alert("Lỗi kết nối server!");
    }
}

//render cart
async function renderCart() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) return;
    
    let res = await fetch(`http://localhost:3000/cart/${user.id}`);
    let cart = await res.json();

    let container = document.getElementById("cart-container");
    if (!container) return;
    
    let total = 0;
    container.innerHTML = "";

    cart.forEach(item => {
        total += item.price * item.quantity;

        container.innerHTML += `
            <div class="cart-item">
                <img src="http://localhost:3000/uploads/${item.image}">
                <div>
                    <h3>${item.name}</h3>
                    <p>Số lượng: ${item.quantity}</p>
                </div>
                <button onclick="removeItem(${item.id})">Xóa</button>
            </div>
        `;
    });
    document.getElementById("total").innerText = "Tổng: " + total.toLocaleString("vi-VN") + "đ";
}

async function removeItem(id) {
    await fetch(`http://localhost:3000/cart/${id}`, {
        method: "DELETE"
    });
    renderCart();
}

async function clearCart() {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user) return;
  
  let res = await fetch(`http://localhost:3000/cart/${user.id}`);
  let cart = await res.json();

  for (let item of cart) {
    await fetch(`http://localhost:3000/cart/${item.id}`, {
        method: "DELETE"
    });
  }
  alert("Đã xóa toàn bộ giỏ hàng!");
  renderCart();
}

function goCheckout() {
    window.location.href = "checkout.html"
}


if (document.getElementById("cart-container")) renderCart ();

// === ORDER ===
async function placeOrder() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if(!user) return;

    let name = document.getElementById("name").value;
    let phone = document.getElementById("phone").value;
    let address = document.getElementById("address").value;

    if (!name || !phone || !address) {
        alert("Nhập thông tin đầy đủ!");
        return;
    }

    //Lấy giỏ hàng
    let resCart = await fetch(`http://localhost:3000/cart/${user.id}`);
    let cart = await resCart.json();

    if (cart.length === 0) {
        alert("Giỏ hàng trống!");
        return;
    }

    const fixedCart = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
    }));

    //Gửi đơn
    let res = await fetch(API + "/api/orders", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user_id: user.id, 
            name, 
            phone,
            address,
            cart: fixedCart
        })
    });

    let data = await res.json();
    alert(data.message || "Đặt hàng thành công!");

    //Xóa giỏ hàng sau khi đặt 
    for (let item of cart) {
        await fetch(`http://localhost:3000/cart/${item.id}`, {
            method: "DELETE"
        });
    }
    window.location.href = "index.html";
}

async function loadCheckout() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) return;

    let res = await fetch(`http://localhost:3000/cart/${user.id}`);
    let cart = await res.json();
    let container = document.getElementById("order-items");
    if (!container) return;

    let total = 0;
    container.innerHTML = "";

    cart.forEach(item => {
        total += item.price * item.quantity;
        container.innerHTML += `
            <div class="cart-item">
                <img src="http://localhost:3000/uploads/${item.image}">
                <div>
                    <h3>${item.name}</h3>
                    <p>Số lượng: ${item.quantity}</p>
                </div>
            </div>
        `;
    });

    document.getElementById("total").innerText = "Tổng: " + total.toLocaleString("vi-VN") + "đ";
}

if (document.getElementById("order-items")) {
    loadCheckout();
}

// Tìm kiếm sản phẩm
function searchSuggest(e) {
    let keyword = e.target.value.toLowerCase();

    let box = document.getElementById("suggestBox");

    if (!keyword) {
        box.innerHTML = "";
        return;
    }

    let filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(keyword)
    );

    let html = "";

    filtered.slice(0, 5).forEach(p => {
        html += `
            <div class="suggest-item" 
                onclick="goDetail('${p.name}','${p.price}','${p.image}')">
                ${p.name}
            </div>
        `;
    });

    box.innerHTML = html;
}

function handleSearch(e) {
    if (e.key === "Enter") {
        let keyword = e.target.value.trim();

        if (!keyword) return;

        // lưu keyword
        localStorage.setItem("searchKeyword", keyword);

        // chuyển sang trang sản phẩm
        window.location.href = "product.html";
    }
}

async function loadDetail() {
    let id = localStorage.getItem("detailId");
    if (!id) return;

    let res = await fetch(API + "/products");
    let products = await res.json();

    let p = products.find(item => item.id == id);
    if (!p) return;

    document.getElementById("productName").innerText = p.name;
    document.getElementById("productPrice").innerText = Number(p.price).toLocaleString('vi-VN') + "đ";
    document.getElementById("productImage").src = "http://localhost:3000/uploads/" + p.image;
    document.getElementById("productStock").innerHTML = "<strong>Tồn kho: </strong>" + p.stock;
    document.getElementById("productDesc").innerHTML = "<strong>Mô tả sản phẩm: </strong>" + (p.description) || "Không có mô tả;"
    //dùng cho giỏ hàng
    localStorage.setItem("name", p.name);
    localStorage.setItem("price", p.price);
    localStorage.setItem("image", "http://localhost:3000/uploads/" + p.image);

    //related products
    let relatedBox = document.getElementById("related-products");

    if (relatedBox) {
        let related = products.filter(item => item.id != p.id).sort(() => 0.5 - Math.random()).slice(0,4);

        let html = "";
        related.forEach(r => {
            html +=`
                <div class="product">
                    <img src="http://localhost:3000/uploads/${r.image}">
                    <h3>${r.name}</h3>
                    <p class="price">${Number(r.price).toLocaleString('vi-VN')}đ</p>
                    <button onclick="goDetail(${r.id})">Xem</button>
                </div>
            `;
        });

        relatedBox.innerHTML = html;
    }
}

if (document.getElementById("productName")) {
    loadDetail();
}

function buyNow() {
    addToCart();
    
    setTimeout (() => {
        window.location.href = "checkout.html";
    }, 300);
}

function changeQty(val) {
    let qty = document.getElementById("qty");
    let current = parseInt(qty.value) || 1;
    current += val;
    if (current < 1) current = 1;
    qty.value = current;
}

// === SLIDER ===
const slides = document.querySelectorAll(".slide");

if (slides.length > 0) {
    let index = 0;
    setInterval(() => {
        slides[index].classList.remove("active");
        index++;

        if (index >= slides.length) {
            index = 0;
        }
        
        slides[index].classList.add("active");
    }, 4000);
}

function loadHomeProducts(type = "random") {

    let home = document.getElementById("home-products");
    if (!home) return;

    home.innerHTML = "";

    let products = [...window.allHomeProducts];

    // đổi active button
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    if (type === "random") {
        document.querySelectorAll(".tab-btn")[0].classList.add("active");

        products = products
            .sort(() => Math.random() - 0.5)
            .slice(0, 4);

    } else {

        document.querySelectorAll(".tab-btn")[1].classList.add("active");

        // sản phẩm mới nhất
        products = products
            .sort((a, b) => b.id - a.id)
            .slice(0, 4);
    }

    products.forEach(p => {

        home.innerHTML += `
            <div class="product">
                <img src="http://localhost:3000/uploads/${p.image}">
                <h3>${p.name}</h3>

                <p class="price">
                    ${Number(p.price).toLocaleString('vi-VN')}đ
                </p>

                <button onclick="goDetail(${p.id})">
                    Xem chi tiết
                </button>
            </div>
        `;
    });
}
    

