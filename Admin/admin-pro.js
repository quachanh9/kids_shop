async function loadDashboardPro() {
    try {
        const res = await fetch("http://localhost:3000/dashboard-pro");
        const data = await res.json();

        console.log("DATA:", data); 

        // ===== CHART =====
        const labels = data.chart.map(i => i.date);
        const revenue = data.chart.map(i => i.revenue);
        const quantity = data.chart.map(i => i.total_quantity || 0);

        new Chart(document.getElementById("chartPro"), {
            type: "line",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Doanh thu",
                        data: revenue,
                        borderColor: "blue",
                        backgroundColor: "rgba(0,123,255,0.2)",
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: "Sản phẩm bán",
                        data: quantity,
                        borderColor: "green",
                        backgroundColor: "rgba(0,255,0,0.2)",
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        position: 'left'
                    },

                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        max: 10,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },

                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label === "Doanh thu") {
                                    return "Doanh thu: " + Number(context.raw).toLocaleString() + "đ";
                                }
                                return "Sản phẩm: " + context.raw;
                            }
                        }
                    }
                }
            }
        });

        // ===== TOP PRODUCT =====
        let topHTML = "";
        data.topProducts.forEach(p => {
            topHTML += `<li>${p.name} <span>${p.sold}</span></li>`;
        });
        document.getElementById("topPro").innerHTML = topHTML;

        // ===== RECENT ORDERS =====
        let orderHTML = "";
        data.recentOrders.forEach(o => {
            orderHTML += `<li>#${o.id} <span>${Number(o.total_price).toLocaleString()}đ</span></li>`;
        });
        document.getElementById("orderPro").innerHTML = orderHTML;

    } catch (err) {
        console.error("Lỗi dashboard-pro:", err);
    }
}

// ✅ GỌI HÀM
document.addEventListener("DOMContentLoaded", () => {
    loadDashboardPro();
});