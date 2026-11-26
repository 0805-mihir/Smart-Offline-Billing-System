
<?php

// Set response format to JSON
header("Content-Type: application/json");

// Connect to MySQL database
include "db.php";

// Accept only POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    echo json_encode([
        "status" => "error",
        "message" => "Invalid request method."
    ]);

    exit;
}

// Read product ID and new stock quantity
$data = json_decode(file_get_contents("php://input"), true);

$productId = (int)($data["product_id"] ?? 0);
$quantity = (int)($data["quantity"] ?? 0);

// Validate input values
if ($productId <= 0 || $quantity <= 0) {

    echo json_encode([
        "status" => "error",
        "message" => "Please enter valid product and quantity."
    ]);

    exit;
}

// Add new stock to existing stock
$stmt = $conn->prepare(
    "UPDATE products
     SET stock_quantity = stock_quantity + ?
     WHERE id = ?"
);

$stmt->bind_param("ii", $quantity, $productId);

// Execute stock update
if ($stmt->execute() && $stmt->affected_rows === 1) {

    echo json_encode([
        "status" => "success",
        "message" => "Stock updated successfully."
    ]);

} else {

    echo json_encode([
        "status" => "error",
        "message" => "Product not found or stock update failed."
    ]);

}

// Close database resources
$stmt->close();
$conn->close();

?>
