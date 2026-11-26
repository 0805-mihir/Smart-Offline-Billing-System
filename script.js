
// ==========================================
// SMART OFFLINE BILLING SYSTEM
// JavaScript functionality
// ==========================================


// Store products received from MySQL database
let products = [];


// Store selected products in shopping cart
let cart = [];


// Load saved sales from browser storage
let sales = JSON.parse(localStorage.getItem("sales")) || [];


// Load bills waiting for synchronization
let pendingBills =
    JSON.parse(localStorage.getItem("pendingBills")) || [];


// PHP backend API URL
const API_URL =
    "http://localhost/smart_billing_backend/get_products.php";


// Generate a unique bill ID
function generateBillId() {
    return "BILL-" + Date.now();
}


// Load products from MySQL database using PHP API
async function loadProducts() {

    const productList = document.getElementById("productList");

    productList.innerHTML = "<p>Loading products...</p>";

    try {

        // Send request to PHP backend
        const response = await fetch(API_URL);

        // Check whether the request was successful
        if (!response.ok) {
            throw new Error("Unable to load products");
        }

        // Convert API response into JSON
        const data = await response.json();

        // Convert database records into frontend product objects
        products = data.map(product => ({
            id: Number(product.id),
            name: product.product_name,
            price: Number(product.price),
            stock: Number(product.stock_quantity)
        }));

        // Display products on the website
        displayProducts();

    } catch (error) {

        console.error("Product loading error:", error);

        productList.innerHTML =
            "<p>Unable to load products. Please check backend connection.</p>";

    }
}


// Display all available products
function displayProducts() {

    const productList = document.getElementById("productList");

    productList.innerHTML = "";

    products.forEach(product => {

        const card = document.createElement("div");

        card.className = "product-card";

        card.innerHTML = `
            <h3>${product.name}</h3>
            <p>Price: ₹${product.price.toFixed(2)}</p>
            <small>Stock: ${product.stock}</small>
            <br><br>
            <button class="add-btn"
                onclick="addToCart(${product.id})">
                Add to Cart
            </button>
        `;

        productList.appendChild(card);

    });

    updateStatistics();
}


// Add selected product to shopping cart
function addToCart(productId) {

    const product = products.find(item => item.id === productId);

    const cartItem = cart.find(item => item.id === productId);

    // Check product availability
    if (!product || (cartItem ? cartItem.quantity : 0) >= product.stock) {

        alert("Sorry, product is out of stock!");

        return;
    }

    if (cartItem) {

        cartItem.quantity++;

    } else {

        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });

    }

    displayCart();
}


// Remove one product from shopping cart
function removeFromCart(productId) {

    cart = cart.filter(item => item.id !== productId);

    displayCart();
}


// Display selected products in the cart
function displayCart() {

    const cartItems = document.getElementById("cartItems");

    cartItems.innerHTML = "";

    if (cart.length === 0) {

        cartItems.innerHTML =
            '<p class="empty-message">Your cart is empty.</p>';

    }

    cart.forEach(item => {

        const row = document.createElement("div");

        row.className = "cart-item";

        row.innerHTML = `
            <div>
                <strong>${item.name}</strong>
                <br>
                <small>₹${item.price} × ${item.quantity}</small>
            </div>

            <div>
                <strong>₹${(item.price * item.quantity).toFixed(2)}</strong>
                <br>
                <button onclick="removeFromCart(${item.id})">
                    Remove
                </button>
            </div>
        `;

        cartItems.appendChild(row);

    });

    calculateBill();
}


// Calculate subtotal, GST and grand total
function calculateBill() {

    let subtotal = 0;

    cart.forEach(item => {

        subtotal += item.price * item.quantity;

    });

    // Calculate demo GST at 5 percent
    const gstAmount = subtotal * 0.05;

    // Calculate final bill amount
    const grandTotal = subtotal + gstAmount;

    document.getElementById("subtotal").textContent =
        "₹" + subtotal.toFixed(2);

    document.getElementById("gst").textContent =
        "₹" + gstAmount.toFixed(2);

    document.getElementById("grandTotal").textContent =
        "₹" + grandTotal.toFixed(2);

}


// Generate customer bill and save sales data
function generateBill() {

    if (cart.length === 0) {

        alert("Please add products to the cart first!");

        return;
    }

    // Create a new bill object
    const bill = {
        billId: generateBillId(),
        date: new Date().toLocaleString(),
        items: cart.map(item => ({ ...item })),
        total: Number(
            document.getElementById("grandTotal").textContent.replace("₹", "")
        ),
        synced: false
    };

    // Save bill in browser sales history
    sales.push(bill);

    localStorage.setItem("sales", JSON.stringify(sales));

    // Add bill to pending synchronization list
    pendingBills.push(bill);

    localStorage.setItem(
        "pendingBills",
        JSON.stringify(pendingBills)
    );

    // Update stock in the current frontend session
    cart.forEach(item => {

        const product = products.find(p => p.id === item.id);

        if (product) {
            product.stock -= item.quantity;
        }

    });

    // Prepare invoice product rows
    const invoiceRows = bill.items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>₹${item.price * item.quantity}</td>
        </tr>
    `).join("");

    // Open invoice in a new browser window
    const invoiceWindow = window.open("", "_blank");

    if (invoiceWindow) {

        invoiceWindow.document.write(`
            <html>
            <head>
                <title>Customer Invoice</title>
                <style>
                    body {
                        font-family: Arial;
                        padding: 25px;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }

                    th, td {
                        padding: 10px;
                        border-bottom: 1px solid #ddd;
                        text-align: left;
                    }

                    h2 {
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <h2>SMART BILLING STORE</h2>
                <p>Bill ID: ${bill.billId}</p>
                <p>Date: ${bill.date}</p>

                <table>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Amount</th>
                    </tr>
                    ${invoiceRows}
                </table>

                <h3>Total: ₹${bill.total.toFixed(2)}</h3>
                <p>Thank you for shopping!</p>

                <script>
                    window.onload = function() {
                        window.print();
                    };
                <\/script>
            </body>
            </html>
        `);

        invoiceWindow.document.close();

    } else {

        alert("Bill saved, but invoice popup was blocked.");

    }

    // Clear cart after bill generation
    cart = [];

    displayCart();

    displayProducts();

    updateStatistics();

    updateSyncStatus();

    alert("Bill generated successfully!");
}


// Update dashboard statistics
function updateStatistics() {

    document.getElementById("totalProducts").textContent =
        products.length;

    const totalSales = sales.reduce(
        (sum, bill) => sum + bill.total, 0
    );

    document.getElementById("totalSales").textContent =
        "₹" + totalSales.toFixed(2);

    document.getElementById("pendingSync").textContent =
        pendingBills.length;
}


// Update internet connection status
function updateConnectionStatus() {

    const status = document.getElementById("connectionStatus");

    const dot = document.querySelector(".status-dot");

    if (navigator.onLine) {

        status.textContent = "Online";

        status.style.color = "#15803d";

        dot.style.backgroundColor = "#22c55e";

    } else {

        status.textContent = "Offline";

        status.style.color = "#dc2626";

        dot.style.backgroundColor = "#dc2626";

    }
}


// Update synchronization message
function updateSyncStatus() {

    document.getElementById("pendingSync").textContent =
        pendingBills.length;

    document.getElementById("syncMessage").textContent =
        pendingBills.length > 0
            ? pendingBills.length + " bill(s) waiting for synchronization."
            : "All data is up to date.";
}


// Simulate synchronization when internet is available
function synchronizeData() {

    if (!navigator.onLine) {

        alert("Internet is not available. Please try again later.");

        return;
    }

    if (pendingBills.length === 0) {

        alert("No pending bills to synchronize.");

        return;
    }

    // Mark pending bills as synchronized in browser storage
    const syncedIds = pendingBills.map(bill => bill.billId);

    sales = sales.map(bill => {

        if (syncedIds.includes(bill.billId)) {

            return { ...bill, synced: true };

        }

        return bill;

    });

    // Clear pending bills
    pendingBills = [];

    localStorage.setItem("sales", JSON.stringify(sales));

    localStorage.setItem(
        "pendingBills",
        JSON.stringify(pendingBills)
    );

    updateStatistics();

    updateSyncStatus();

    alert("Data synchronization simulation completed!");
}


// Display the current date
function displayCurrentDate() {

    document.getElementById("currentDate").textContent =
        new Date().toLocaleDateString();
}


// Listen for internet connection changes
window.addEventListener("online", function() {

    updateConnectionStatus();

    updateSyncStatus();

});


window.addEventListener("offline", function() {

    updateConnectionStatus();

    updateSyncStatus();

});


// Connect dashboard buttons with their functions
document.getElementById("checkoutBtn")
    .addEventListener("click", generateBill);

document.getElementById("syncBtn")
    .addEventListener("click", synchronizeData);


// Initialize the application
displayCart();

displayCurrentDate();

updateConnectionStatus();

updateStatistics();

updateSyncStatus();

// Load products from the MySQL database
loadProducts();
