
<?php
// Include database connection
include "db.php";

// SQL query to get all products
$sql = "SELECT * FROM products";

// Execute the query
$result = $conn->query($sql);

// Create an array to store products
$products = [];

// Check if products are available
if ($result->num_rows > 0) {

    // Fetch each product from database
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
}

// Set response format to JSON
header("Content-Type: application/json");

// Display products as JSON
echo json_encode($products);

// Close database connection
$conn->close();
?>
