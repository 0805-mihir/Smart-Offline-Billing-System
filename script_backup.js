
 // ==========================================
 // SMART OFFLINE BILLING SYSTEM
 // Complete JavaScript Functionality
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


// ==========================================
// GENERATE UNIQUE BILL ID
// ==========================================

function generateBillId() {

    return "BILL-" + Date.now();

}


// ==========================================
// LOAD PRODUCTS FROM MYSQL DATABASE
// ==========================================

async function loadProducts() {

    const productList = document.getElementById("productList");

    productList.innerHTML = "<p>Loading products...</p>";

    try {

        // Send request to PHP backend
        const response = await fetch(API_URL);

        // Check whether the request was successful
        if (!response.ok) {
            throw new Error("Unable to load products.");
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


// ==========================================
// DISPLAY AVAILABLE PRODUCTS
// ==========================================

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


// ==========================================
// ADD PRODUCT TO SHOPPING CART
// ==========================================

function addToCart(productId) {

    const product = products.find(item => item.id === productId);

    const cartItem = cart.find(item => item.id === productId);

    // Check product availability
    if (!product || (cartItem ? cartItem.quantity : 0) >= product.stock) {

        alert("Sorry, product is out of stock!");

        return;
    }

    // Increase quantity if product already exists in cart
    if (cartItem) {

        cartItem.quantity++;

    } else {

        // Add new product to cart
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });

    }

    displayCart();

}


// ==========================================
// REMOVE PRODUCT FROM SHOPPING CART
// ==========================================

function removeFromCart(productId) {

    cart = cart.filter(item => item.id !== productId);

    displayCart();

}


// ==========================================
// DISPLAY SHOPPING CART
// ==========================================

function displayCart() {

    const cartItems = document.getElementById("cartItems");

    cartItems.innerHTML = "";

    // Display message when cart is empty
    if (cart.length === 0) {

        cartItems.innerHTML =
            '<p class="empty-message">Your cart is empty.</p>';

    }

    // Display each selected product
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


// ==========================================
// CALCULATE BILL AMOUNT
// ==========================================

function calculateBill() {

    // Calculate subtotal
    let subtotal = 0;

    cart.forEach(item => {

        subtotal += item.price * item.quantity;

    });

    // Calculate demo GST at 5 percent
    const gstAmount = subtotal * 0.05;

    // Calculate final bill amount
    const grandTotal = subtotal + gstAmount;

    // Display subtotal
    document.getElementById("subtotal").textContent =
        "₹" + subtotal.toFixed(2);

    // Display GST
    document.getElementById("gst").textContent =
        "₹" + gstAmount.toFixed(2);

    // Display grand total
    document.getElementById("grandTotal").textContent =
        "₹" + grandTotal.toFixed(2);

}


// ==========================================
// GENERATE BILL AND SAVE IN MYSQL DATABASE
// ==========================================

async function generateBill() {

    // Check whether the cart is empty
    if (cart.length === 0) {

        alert("Please add products to the cart first!");

        return;
    }

    // Calculate subtotal
    const subtotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    // Calculate demo GST at 5 percent
    const gst = subtotal * 0.05;

    // Calculate final bill amount
    const grandTotal = subtotal + gst;

    // Generate unique bill ID
    const billId = generateBillId();

    // Prepare bill information for PHP backend
    const billData = {
        bill_id: billId,
        items: cart,
        subtotal: subtotal,
        gst: gst,
        grand_total: grandTotal
    };

    try {

        // Send bill information to PHP backend
        const response = await fetch(
            "http://localhost/smart_billing_backend/save_bill.php",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(billData)
            }
        );

        // Read backend response
        const result = await response.json();

        // Check whether bill was saved successfully
        if (!response.ok || result.status !== "success") {

            throw new Error(
                result.message || "Bill could not be saved."
            );

        }

        // Create bill record for browser sales history
        const bill = {
            billId: billId,
            date: new Date().toLocaleString(),
            items: cart.map(item => ({ ...item })),
            total: grandTotal,
            synced: true
        };

        // Save bill in browser storage
        sales.push(bill);

        localStorage.setItem(
            "sales",
            JSON.stringify(sales)
        );

        // Update product stock in frontend
        cart.forEach(item => {

            const product = products.find(
                p => p.id === item.id
            );

            if (product) {

                product.stock -= item.quantity;

            }

        });

        // Prepare invoice product rows
        const invoiceRows = bill.items.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join("");

        // Open invoice in a new browser window
        const invoiceWindow = window.open("", "_blank");

        if (invoiceWindow) {

            // Create printable invoice
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

                    <p>Bill ID: ${billId}</p>

                    <p>Date: ${bill.date}</p>

                    <table>

                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Amount</th>
                        </tr>

                        ${invoiceRows}

                    </table>

                    <h3>Subtotal: ₹${subtotal.toFixed(2)}</h3>

                    <h3>GST (5%): ₹${gst.toFixed(2)}</h3>

                    <h2>Grand Total: ₹${grandTotal.toFixed(2)}</h2>

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

        // Clear cart after successful database save
        cart = [];

        displayCart();

        displayProducts();

        updateStatistics();

        updateSyncStatus();

        // Show success message
        alert("Bill saved successfully in MySQL Database!");

    } catch (error) {

        // Display error if database saving fails
        console.error("Bill saving error:", error);

        alert("Bill was NOT saved in database: " + error.message);

    }

}


// ==========================================
// UPDATE DASHBOARD STATISTICS
// ==========================================

function updateStatistics() {

    // Display total number of products
    document.getElementById("totalProducts").textContent =
        products.length;

    // Calculate total sales from browser storage
    const totalSales = sales.reduce(
        (sum, bill) => sum + Number(bill.total || 0),
        0
    );

    // Display total sales
    document.getElementById("totalSales").textContent =
        "₹" + totalSales.toFixed(2);

    // Display pending synchronization count
    document.getElementById("pendingSync").textContent =
        pendingBills.length;

}


// ==========================================
// UPDATE INTERNET CONNECTION STATUS
// ==========================================

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


// ==========================================
// UPDATE SYNCHRONIZATION STATUS
// ==========================================

function updateSyncStatus() {

    document.getElementById("pendingSync").textContent =
        pendingBills.length;

    document.getElementById("syncMessage").textContent =
        pendingBills.length > 0
            ? pendingBills.length + " bill(s) waiting for synchronization."
            : "All data is up to date.";

}


// ==========================================
// SIMULATE DATA SYNCHRONIZATION
// ==========================================

function synchronizeData() {

    // Check internet connection
    if (!navigator.onLine) {

        alert("Internet is not available. Please try again later.");

        return;
    }

    // Check pending bills
    if (pendingBills.length === 0) {

        alert("No pending bills to synchronize.");

        return;
    }

    // Get IDs of pending bills
    const syncedIds = pendingBills.map(
        bill => bill.billId
    );

    // Mark bills as synchronized in browser storage
    sales = sales.map(bill => {

        if (syncedIds.includes(bill.billId)) {

            return { ...bill, synced: true };

        }

        return bill;

    });

    // Clear pending bills
    pendingBills = [];

    localStorage.setItem(
        "sales",
        JSON.stringify(sales)
    );

    localStorage.setItem(
        "pendingBills",
        JSON.stringify(pendingBills)
    );

    // Update dashboard
    updateStatistics();

    updateSyncStatus();

    alert("Data synchronization simulation completed!");

}


// ==========================================
// DISPLAY CURRENT DATE
// ==========================================

function displayCurrentDate() {

    document.getElementById("currentDate").textContent =
        new Date().toLocaleDateString();

}


// ==========================================
// LOAD SALES HISTORY FROM MYSQL DATABASE
// ==========================================

async function loadSalesHistory() {

    // Get the sales history container
    const salesHistory = document.getElementById("salesHistory");

    // Display loading message
    salesHistory.innerHTML =
        "<p>Loading sales history...</p>";

    try {

        // Request sales records from PHP backend
        const response = await fetch(
            "http://localhost/smart_billing_backend/get_sales.php"
        );

        // Check whether the request was successful
        if (!response.ok) {

            throw new Error("Unable to load sales history.");

        }

        // Convert response into JSON data
        const data = await response.json();

        // Check whether sales records are available
        if (!Array.isArray(data) || data.length === 0) {

            salesHistory.innerHTML =
                "<p>No sales records found.</p>";

            return;
        }

        // Create HTML table for sales records
        let tableHTML = `
            <table border="1" cellpadding="10" cellspacing="0">

                <thead>

                    <tr>
                        <th>Bill ID</th>
                        <th>Product Name</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                        <th>GST</th>
                        <th>Grand Total</th>
                        <th>Bill Date</th>
                    </tr>

                </thead>

                <tbody>
        `;

        // Add every sales record to the table
        data.forEach(bill => {

            tableHTML += `
                <tr>
                    <td>${bill.bill_id}</td>
                    <td>${bill.product_name}</td>
                    <td>${bill.quantity}</td>
                    <td>₹${Number(bill.price).toFixed(2)}</td>
                    <td>₹${Number(bill.subtotal).toFixed(2)}</td>
                    <td>₹${Number(bill.gst).toFixed(2)}</td>
                    <td>₹${Number(bill.grand_total).toFixed(2)}</td>
                    <td>${bill.bill_date}</td>
                </tr>
            `;

        });

        // Close HTML table
        tableHTML += `
                </tbody>
            </table>
        `;

        // Display sales history on website
        salesHistory.innerHTML = tableHTML;

    } catch (error) {

        // Display error in browser console
        console.error("Sales history error:", error);

        salesHistory.innerHTML =
            "<p>Unable to load sales history. Please check backend connection.</p>";

    }

}


// ==========================================
// LISTEN FOR INTERNET CONNECTION CHANGES
// ==========================================

window.addEventListener("online", function() {

    updateConnectionStatus();

    updateSyncStatus();

});


window.addEventListener("offline", function() {

    updateConnectionStatus();

    updateSyncStatus();

});


// ==========================================
// CONNECT DASHBOARD BUTTONS WITH FUNCTIONS
// ==========================================

// Generate bill button
document.getElementById("checkoutBtn")
    .addEventListener("click", generateBill);


// Synchronization button
document.getElementById("syncBtn")
    .addEventListener("click", synchronizeData);


// ==========================================
// INITIALIZE THE APPLICATION
// ==========================================

// Display initial shopping cart
displayCart();

// Display current date
displayCurrentDate();

// Display internet connection status
updateConnectionStatus();

// Display dashboard statistics
updateStatistics();

// Display synchronization status
updateSyncStatus();

// Load products from MySQL database
loadProducts();
