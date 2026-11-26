# Smart Offline Billing System

## 📌 Project Overview

Smart Offline Billing System is a web-based billing application designed for small shops and businesses.

It allows users to manage products, generate customer bills, maintain sales history, and update product stock. The system also supports basic offline billing by temporarily storing bills in the browser and synchronizing them with the database when the browser comes online.

## 🎯 Project Objectives

- Simplify the billing process.
- Manage product information and stock.
- Generate customer bills automatically.
- Maintain sales history.
- Support basic offline bill storage.
- Synchronize pending bills with the database when the browser comes online.

## 🚀 Features

- **Product Management:** Display products and prices from the MySQL database.
- **Shopping Cart:** Add products, change quantities, and remove items.
- **Automatic Bill Calculation:** Calculate subtotal, 5% demo GST, and grand total.
- **Bill Generation:** Generate and print customer invoices.
- **Sales History:** View previously generated bills.
- **Stock Management:** Automatically reduce stock after successful online billing.
- **Stock Refill:** Add new stock to existing products.
- **Basic Offline Billing:** Store bills temporarily in browser localStorage when offline.
- **Automatic Synchronization:** Send pending bills to the PHP backend when the browser comes online.

## 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript
- PHP
- MySQL
- XAMPP
- phpMyAdmin
- GitHub

## 📂 Project Structure

```text
Smart-Offline-Billing-System/
│
├── index.html
├── style.css
├── script.js
├── script_backup.js
│
├── get_products.php
├── get_sales.php
├── save_bill.php
├── test_connection.php
├── update_stock.php
│
├── db.example.php
└── README.md
```

## ⚙️ Installation and Setup Instructions

### 1. Install Required Software

Install the following software:

- XAMPP
- Visual Studio Code
- Web Browser

### 2. Copy Project Files

Copy the frontend files into:

```text
C:\xampp\htdocs\Smart_Offline_Billing_System
```

Copy the PHP backend files into:

```text
C:\xampp\htdocs\smart_billing_backend
```

### 3. Start XAMPP

1. Open XAMPP Control Panel.
2. Start Apache.
3. Start MySQL.

### 4. Create MySQL Database

1. Open phpMyAdmin.
2. Create a database named:

```sql
smart_billing_db
```

3. Create the required `products` and `sales` tables.
4. Insert sample product records into the `products` table.

### 5. Configure Database Connection

1. Copy `db.example.php` and rename the copy to `db.php`.
2. Open `db.php`.
3. Enter your local MySQL username, password, database name, and port.
4. Save the file.

**Note:** The actual `db.php` configuration file is not included in this public repository.

### 6. Run the Project

Open the following URL in your browser:

```text
http://localhost/Smart_Offline_Billing_System/index.html
```

## 🔄 How Offline Billing Works

1. Products are loaded from the MySQL database when the application starts.
2. When the browser is offline, generated bills are temporarily stored in browser localStorage.
3. Pending bills are synchronized with the PHP backend when the browser comes online.
4. Successfully synchronized bills are removed from the pending list.

**Note:** This project demonstrates basic offline billing. The frontend and product loading still require the local XAMPP server. Refreshing the page while offline is not supported.

## 🗄️ Database Tables

### Products Table

Stores product details such as:

- Product ID
- Product Name
- Category
- Price
- Stock Quantity

### Sales Table

Stores sales details such as:

- Bill ID
- Product Name
- Quantity
- Price
- Subtotal
- GST
- Grand Total
- Bill Date

## 📸 Project Screenshots

Add your application screenshots here.

## 🔮 Future Improvements

- Full offline support using Progressive Web App (PWA).
- Improved database transaction and billing validation.
- Better sales reports and analytics.
- User authentication and role management.

## 👨‍💻 Developer

**Name:** Mihir Koshti

**Course:** B.E. Computer Engineering

**Academic Year:** 2026–27

## 📄 License

This project is created for educational and learning purposes.
