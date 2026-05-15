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

    // xoá sau khi dùng
    localStorage.removeItem("searchKeyword");
}

renderProducts(products);
setupFilter();
    
    // === HOME PRODUCT ===
    window.allHomeProducts = products;
    loadHomeProducts("random");
}

loadProducts();

// === RENDER PRODUCTS ===
function renderProducts(products) {
    let container = document.getElementById("product-container");
    if (!container) return;
    container.innerHTML = "";
    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-product">Không tìm thấy sản phẩm</div>
        `;
        return;
    }

    products.forEach(p => {
        container.innerHTML += `
            <div class="product">
                <div class="product-image">
                    <img src="http://localhost:3000/uploads/${p.image}">
                </div>

                <div class="product-content">
                    <div class="product-category">${p.category || "Sản phẩm"}</div>
                    <h3>${p.name}</h3>
                    <p class="price">${Number(p.price).toLocaleString("vi-VN")}đ</p>
                    <button onclick="goDetail(${p.id})">Xem chi tiết</button>
                </div>
            </div>
        `;
    });
}

// === FILTER ===
function setupFilter() {
    const category = document.getElementById("filterCategory");
    const size = document.getElementById("filterSize");
    const sort = document.getElementById("sortPrice");

    if (!category || !size || !sort) return;

    function applyFilter() {
        let filtered = [...allProducts];
        //CATEGORY
        if (category.value) {
            filtered = filtered.filter(p => {
                return (p.category && p.category.toLowerCase().trim() === category.value.toLowerCase().trim());
            });
        }

        // SIZE
        if (size.value) {

            filtered = filtered.filter(p => {

        if (!p.sizes) return false;

            let sizeList = p.sizes
                .split(",")
                .map(s => s.trim());

            return sizeList.includes(size.value);
            });
        }

        //SORT PRICE
        if (sort.value === "low") {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sort.value === "high") {
            filtered.sort((a,b) => b.price - a.price);
        }

        renderProducts(filtered);
    }

    category.addEventListener("change", applyFilter);
    size.addEventListener("change", applyFilter);
    sort.addEventListener("change", applyFilter);
}

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
        let size = localStorage.getItem("selectedSize") || "0-6M"; 

        let res = await fetch("http://localhost:3000/cart", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: user.id,
                product_id,
                quantity, 
                size
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

        let itemTotal = item.price * item.quantity;
        container.innerHTML += `
           <div class="cart-item">
                <img src="http://localhost:3000/uploads/${item.image}">
                <div class="cart-info">
                    <h3>${item.name}</h3>
                    <p>Size: ${item.size}</p>
                    <p>
                        Giá: ${Number(item.price).toLocaleString("vi-VN")}đ
                    </p>
                    <div class="cart-qty">
                        <button onclick="changeCartQty(${item.id}, ${item.quantity - 1})"> - </button>
                        <span>${item.quantity}</span>
                        <button onclick="changeCartQty(${item.id}, ${item.quantity + 1})"> + </button>
                    </div>

                    <p class="item-total"> Thành tiền: ${Number(itemTotal).toLocaleString("vi-VN")}đ</p>

                </div>

                <button class="remove-btn" onclick="removeItem(${item.id})">Xóa</button>

           </div> 
        `;
    });
    document.getElementById("total").innerText = "Tổng: " + total.toLocaleString("vi-VN") + "đ";
}

async function changeCartQty(id, quantity) {
    if (quantity < 1) return;

    await fetch(`http://localhost:3000/cart/${id}`,{
        method: "PUT",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ quantity })
    });

    renderCart();
}

async function removeItem(id) {
    let check = confirm("Bạn có muốn xóa sản phẩm này không?");

    if(!check) return;
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

function checkout() {
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
        price: item.price,
        size: item.size
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
    document.getElementById("name").value = user.username;

    let res = await fetch(`http://localhost:3000/cart/${user.id}`);
    let cart = await res.json();
    let container = document.getElementById("order-items");
    if (!container) return;

    let total = 0;
    container.innerHTML = "";

    cart.forEach(item => {
        total += item.price * item.quantity;
        let itemTotal = item.price * item.quantity;
        
        container.innerHTML += `
            <div class="checkout-item">
                <img src="http://localhost:3000/uploads/${item.image}">
                <div class="checkout-info">
                    <h3>${item.name}</h3>
                    <p>Size: ${item.size}</p>
                    <p>Số lượng: ${item.quantity}</p>
                    <p> Giá: ${Number(item.price).toLocaleString("vi-VN")}đ</p>
                    <p class="checkout-total">Thành tiền: ${Number(itemTotal).toLocaleString("vi-VN")}đ</p>
                </div>
            </div>
        `;
    });

    let shipping = 30000;
    let finalTotal = total + shipping;
    document.getElementById("total").innerText = "Tổng: " + finalTotal.toLocaleString("vi-VN") + "đ";
}

if (document.getElementById("order-items")) {
    loadCheckout();
}

async function loadProvince() {

    let res = await fetch("https://provinces.open-api.vn/api/p/");
    let provinces = await res.json();

    let province = document.getElementById("province");

    provinces.forEach(p => {
        province.innerHTML += `
            <option value="${p.code}">
                ${p.name}
            </option>
        `;
    });
}

// LOAD QUẬN HUYỆN
async function loadDistrict(provinceCode) {

    let district = document.getElementById("district");

    district.innerHTML =
        `<option>Chọn quận / huyện</option>`;

    let ward = document.getElementById("ward");

    ward.innerHTML =
        `<option>Chọn phường / xã</option>`;

    let res = await fetch(
        `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
    );

    let data = await res.json();

    data.districts.forEach(d => {

        district.innerHTML += `
            <option value="${d.code}">
                ${d.name}
            </option>
        `;
    });
}

// LOAD PHƯỜNG XÃ
async function loadWard(districtCode) {

    let ward = document.getElementById("ward");

    ward.innerHTML =
        `<option>Chọn phường / xã</option>`;

    let res = await fetch(
        `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
    );

    let data = await res.json();

    data.wards.forEach(w => {

        ward.innerHTML += `
            <option value="${w.code}">
                ${w.name}
            </option>
        `;
    });
}

// KHI CHỌN TỈNH
if (document.getElementById("province")) {

    loadProvince();

    document
        .getElementById("province")
        .addEventListener("change", function () {

            loadDistrict(this.value);
        });
}

// KHI CHỌN QUẬN
if (document.getElementById("district")) {

    document
        .getElementById("district")
        .addEventListener("change", function () {

            loadWard(this.value);
        });
}


if(document.getElementById("province")) {
    loadProvince();
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
    if (document.getElementById("bottomDescription")) {
        document.getElementById("bottomDescription").innerText = p.description || "Chưa có mô tả sản phẩm";
    }

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

function selectSize(btn) {
    document.querySelectorAll(".size-btn").forEach(item => {
        item.classList.remove("active");
    });

    btn.classList.add("active");
    localStorage.setItem("selectedSize", btn.innerText);
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

//=== HISTORY ===
async function loadHistory() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) {
        window.location.href = "auth.html";
        return;
    }

    let res = await fetch(`http://localhost:3000/api/orders/user/${user.id}`);
    let orders = await res.json();
    let container = document.getElementById("history-container");
    
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML =`
            <div class="empty-history">Bạn chưa có đơn hàng nào</div>
        `;
        return;
    }

    container.innerHTML = "";
    orders.forEach(item => {
        let total = item.price * item.quantity;
        container.innerHTML = "";

    orders.forEach(item => {

        let total = item.price * item.quantity;

        let statusText = "Đang xử lý";
        let statusClass = "pending";

        if(item.status === "confirmed") {
            statusText = "Đã xác nhận";
            statusClass = "confirmed";
        }        

        if(item.status === "shipping") {
            statusText = "Đang giao";
            statusClass = "shipping";
        }

        if(item.status === "done") {
            statusText = "Đã giao";
            statusClass = "done";
        }

        if(item.status === "cancel") {
            statusText = "Đã hủy";
            statusClass = "cancel";
        }

    container.innerHTML += `
        <div class="history-card">

            <div class="history-left">
                <img src="http://localhost:3000/uploads/${item.image}">
            </div>

            <div class="history-info">

                <div class="history-top">
                    <h3>${item.name}</h3>

                    <div class="history-status ${statusClass}">
                        ${statusText}
                    </div>
                </div>

                <div class="history-meta">
                    <p>📦 Số lượng: ${item.quantity}</p>
                    <p>💰 Giá: ${Number(item.price).toLocaleString("vi-VN")}đ</p>
                    <p>📍 ${item.address}</p>
                    <p>📞 ${item.phone}</p>
                </div>

                <div class="history-bottom">

                    <div class="history-date">
                        ${new Date(item.created_at).toLocaleString("vi-VN")}
                    </div>

                    <div class="history-total">
                        ${Number(total).toLocaleString("vi-VN")}đ
                    </div>

                </div>

            </div>

        </div>
    `;
    });
    });
}

if (document.getElementById("history-container")) {
    loadHistory();
}
