const API = "http://localhost:3000";

let editingId = null;
let productData = [];

// =======================
// LOAD PRODUCTS
// =======================
async function loadProducts() {
    try {
        const res = await fetch(API + "/products");
        const data = await res.json();

        if (JSON.stringify(data) === JSON.stringify(productData)) return;

        productData = data;

        let html = "";

        data.forEach(p => {
            const img = p.image
                ? `${API}/uploads/${p.image}`
                : "";

            html += `
                <div class="product">
                    <img src="${img}">
                    <h3>${p.name}</h3>
                    <p class="price">${Number(p.price).toLocaleString('vi-VN')}đ</p>
                    <p class="stock">Tồn: ${p.stock}</p>
                    <p class="desc">${p.description || ""}</p>

                    <button class="edit" onclick="editProduct(${p.id})">Sửa</button>
                    <button class="delete" onclick="deleteProduct(${p.id})">Xóa</button>
                </div>
            `;
        });

        document.getElementById("product-list").innerHTML = html;

    } catch (err) {
        console.log("Lỗi load:", err);
    }
}

// =======================
// ADD / UPDATE PRODUCT
// =======================
const form = document.getElementById("productForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("name", document.getElementById("name").value);
    formData.append("price", document.getElementById("price").value);
    formData.append("stock", document.getElementById("stock").value);
    formData.append("description", document.getElementById("description").value);

    const file = document.getElementById("image").files[0];

    // 🔥 nếu thêm mới thì bắt buộc có ảnh
    if (!file && !editingId) {
        alert("Chọn ảnh!");
        return;
    }

    // 🔥 nếu có ảnh thì mới gửi
    if (file) {
        formData.append("image", file);
    }

    try {
        let url = API + "/products";
        let method = "POST";

        // 🔥 nếu đang sửa
        if (editingId) {
            url = API + "/products/" + editingId;
            method = "PUT";
        }

        const res = await fetch(url, {
            method: method,
            body: formData
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Lỗi!");
            return;
        }

        alert(editingId ? "Sửa thành công!" : "Thêm thành công!");

        form.reset();
        editingId = null;

        loadProducts();

    } catch (err) {
        console.log("Lỗi submit:", err);
        alert("Lỗi server!");
    }
});

// =======================
// EDIT PRODUCT
// =======================
function editProduct(id) {
    const p = productData.find(item => item.id == id);

    if (!p) return;

    document.getElementById("name").value = p.name;
    document.getElementById("price").value = p.price;
    document.getElementById("stock").value = p.stock;
    document.getElementById("description").value = p.description;

    editingId = id;

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// =======================
// DELETE PRODUCT
// =======================
async function deleteProduct(id) {
    if (!confirm("Xóa sản phẩm?")) return;

    await fetch(API + "/products/" + id, {
        method: "DELETE"
    });

    const el = document.getElementById("product-" + id);
    if (el) el.remove();

    loadProducts();
}

// =======================
loadProducts();

// =======================
// SWITCH PAGE
// =======================
function showPage(page) {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");

    const menuItems = document.querySelectorAll('.sidebar li');
    menuItems.forEach(li => li.classList.remove('active'));

    if (page === 'dashboard') {
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('page-title').innerText = 'Dashboard';
        menuItems[0].classList.add('active');
        loadDashboard();
    }

    if (page === 'products') {
        document.getElementById('products-page').style.display = 'block';
        document.getElementById('page-title').innerText = 'Sản phẩm';
        menuItems[1].classList.add('active');
        loadProducts();
    }

    if (page === 'categories') {
        document.getElementById('categories-page').style.display = 'block';
        document.getElementById('page-title').innerText = 'Danh mục';
        menuItems[2].classList.add('active');
        loadCategories();
    } 

    if (page ==='sizes') {
        document.getElementById('sizes-page').style.display = 'block';
        document.getElementById('page-title').innerText = 'Quản lý size';
        menuItems[3].classList.add('active');
        loadSizes();
    }

    if (page === 'users') {
        document.getElementById('users-page').style.display = 'block';
        document.getElementById('page-title').innerText = 'Tài khoản';
        menuItems[4].classList.add('active');
        loadUsers();
    }

    if (page === "orders") {
        document.getElementById("orders-page").style.display = "block";
        document.getElementById("page-title").innerText = "Quản lý đơn hàng";
        menuItems[5].classList.add('active');
        loadOrders();
    }

    if (page === 'settings') {
        document.getElementById('settings-page').style.display = 'block';
        document.getElementById('page-title').innerText = 'Cài đặt';
        menuItems[6].classList.add('active');
    }
}

// =======================
// LOAD DASHBOARD
// =======================
async function loadDashboard() {
    try {
        const res = await fetch(API + "/dashboard");
        const data = await res.json();

        document.getElementById("revenue").innerText =
            Number(data.totalRevenue).toLocaleString('vi-VN') + "đ";

        document.getElementById("orders").innerText = data.totalOrders;
        document.getElementById("products").innerText = data.totalProducts;
        document.getElementById("users").innerText = data.totalUsers;

    } catch (err) {
        console.log("Lỗi dashboard:", err);
    }
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('hide');
}

async function loadOrders() {
    try {
        let res = await fetch(API + "/api/orders");
        let data = await res.json();

        let html = "";

        data.forEach(o => {
            html += `
                <tr>
                    <td>#${o.id}</td>
                    <td>${o.name || "Khách lẻ"}</td>
                    <td>${o.phone || ""}</td>
                    <td class="price">
                        ${Number(o.total_price).toLocaleString('vi-VN')}đ
                    </td>
                    <td>${new Date(o.created_at).toLocaleString('vi-VN')}</td>

                    <td>
                        <select onchange="updateStatus(${o.id}, this.value)">

                            <option value="pending"
                                ${o.status === "pending" ? "selected" : ""}>Chờ xác nhận
                            </option>

                            <option value="confirmed"
                                ${o.status === "confirmed" ? "selected" : ""}>Đã xác nhận
                            </option>

                            <option value="shipping"
                                ${o.status === "shipping" ? "selected" : ""}>Đang giao
                            </option>

                            <option value="done"
                                ${o.status === "done" ? "selected" : ""}>Đã giao
                            </option>

                            <option value="cancel"
                                ${o.status === "cancel" ? "selected" : ""}>Đã hủy
                            </option>

                        </select>
                    </td>

                    <td>
                        <button onclick="viewDetail(${o.id})">Xem</button>
                        <button onclick="deleteOrder(${o.id})">Xóa</button>
                    </td>
                </tr>
            `;
        });

        document.getElementById("order-list").innerHTML = html;

    } catch (err) {
        console.log(err);
    }
}

async function viewDetail(id) {

    let res = await fetch(API + "/api/orders/" + id + "/items");

    let data = await res.json();

    let total = 0;

    let html = "";

    data.forEach(i => {

        let itemTotal = Number(i.price) * Number(i.quantity);

        total += itemTotal;

        html += `
            <div class="order-item">

                <h3>🛍 ${i.name}</h3>

                <p>📏 Size: ${i.sizes || "Không có"}</p>

                <p>🔢 Số lượng: ${i.quantity}</p>

                <p>💰 Giá:
                    ${Number(i.price).toLocaleString('vi-VN')}đ
                </p>

                <p>
                    🧾 Thành tiền:
                    <b>${itemTotal.toLocaleString('vi-VN')}đ</b>
                </p>

            </div>
        `;
    });

    html += `
        <div class="order-total">
            Tổng tiền:
            ${total.toLocaleString('vi-VN')}đ
        </div>
    `;

    document.getElementById("orderDetailContent").innerHTML = html;

    document.getElementById("orderModal").style.display = "flex";
}

// === CATEGORY ===
async function loadCategories() {
    let res = await fetch(API + "/categories");
    let data = await res.json();

    let html ="";

    data.forEach(c => {
        html += `
            <div class="category-item">
                <h3>${c.name}</h3>
                <div class="action-btns">
                    <button class="delete-btn" onclick="deleteCategory(${c.id})">Xóa</button>
                </div>
            </div>
        `;
    });

    document.getElementById("category-list").innerHTML = html;
}

async function addCategory() {
    let name = document.getElementById("categoryName").value;
    if (!name) return;

    await fetch(API + "/categories", {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({ name })
    });

    document.getElementById("categoryName").value = "";

    loadCategories();
}

async function deleteCategory(id) {
    if(!confirm("Xóa danh mục?")) return;

    await fetch(API + "/categories/" + id, {
        method: "DELETE"
    });

    loadCategories();
}

// === SIZE ===
async function loadSizes() {
    let res = await fetch(API + "/sizes");
    let data = await res.json();
    let html = "";

    data.forEach(s => {
        html += `
            <div class="size-item">
                <h3>${s.name}</h3>
                <div class="action-btns">
                    <button class="delete-btn" onclick="deleteSize(${s.id})">Xóa</button>
                </div>
            </div>
        `;
    });

    document.getElementById("size-list").innerHTML = html;
}

async function addSize() {
    let name = document.getElementById("sizeName").value;

    if (!name) return;

    await fetch(API + "/sizes", {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({ name })
    });

    document.getElementById("sizeName").value = "";

    loadSizes();
}

async function deleteSize(id) {
    if (!confirm("Xóa size?")) return;

    await fetch(API + "/sizes/" + id, {
        method: "DELETE"
    });

    loadSizes();
}

//=== USERS ===
async function loadUsers() {
    let res = await fetch(API + "/users");
    let data = await res.json();
    let html = "";

    data.forEach (u => {
        html += `
            <tr>
                <td>${u.id}</td>
                <td>${u.username}</td>
                <td>${u.email}</td>
                <td>${u.role}</td>
                <td>${new Date(u.created_at).toDateString("vi-VN")}</td>
                <td>
                    <button class="delete-btn" onclick="deleteUser(${u.id})">Xóa</button>
                </td>
            </tr>
        `;
    });

    document.getElementById("user-list").innerHTML = html;
}

async function deleteUser(id) {
    if (!confirm("Xóa tài khoản?")) return;

    await fetch(API + "/users/" + id, {
        method: "DELETE"
    });

    loadUsers(); 
}

async function updateStatus(id, status) {
    await fetch(API + "/api/orders/" + id + "/status", {
        method: "PUT",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ status })
    });

    loadOrders();
}

// LOAD mặc định
loadDashboard();
showPage("dashboard");

setInterval(() => {
    loadProducts();
}, 3000);

window.addEventListener("focus", () => {
    loadProducts();
});

function closeOrderModal() {
    document.getElementById("orderModal").style.display = "none";
}