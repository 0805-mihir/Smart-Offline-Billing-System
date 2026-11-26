
<?php

// Set response format to JSON
header("Content-Type: application/json");

// Include database connection
include "db.php";

// Accept only POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "status" => "error",
        "message" => "Invalid request method."
    ]);
    exit;
}

// Read bill information sent by JavaScript
$data = json_decode(file_get_contents("php://input"), true);

// Validate bill information
if (
    empty($data["bill_id"]) ||
    empty($data["items"]) ||
    !isset($data["subtotal"]) ||
    !isset($data["gst"]) ||
    !isset($data["grand_total"])
) {
    echo json_encode([
        "status" => "error",
        "message" => "Incomplete bill information."
    ]);
    exit;
}

// Start database transaction
$conn->begin_transaction();

try {

    // Prepare query to check available stock
    $stockQuery = $conn->prepare(
        "SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE"
    );

    // Prepare query to reduce product stock
    $updateStock = $conn->prepare(
        "UPDATE products
         SET stock_quantity = stock_quantity - ?
         WHERE id = ? AND stock_quantity >= ?"
    );

    // Prepare query to save bill details
    $insertBill = $conn->prepare(
        "INSERT INTO sales
        (bill_id, product_name, quantity, price,
         subtotal, gst, grand_total)
        VALUES (?, ?, ?, ?, ?, ?, ?)"
    );

    // Process every product in the bill
    foreach ($data["items"] as $item) {

        $productId = (int)$item["id"];
        $productName = $item["name"];
        $quantity = (int)$item["quantity"];
        $price = (float)$item["price"];

        // Validate product information
        if ($productId <= 0 || $quantity <= 0) {
            throw new Exception("Invalid product information.");
        }

        // Check current product stock
        $stockQuery->bind_param("i", $productId);
        $stockQuery->execute();

        $stockResult = $stockQuery->get_result();
        $product = $stockResult->fetch_assoc();

        // Check whether product exists
        if (!$product) {
            throw new Exception("Product not found.");
        }

        // Check whether enough stock is available
        if ($product["stock_quantity"] < $quantity) {
            throw new Exception(
                "Insufficient stock for " . $productName
            );
        }

        // Reduce stock in database
        $updateStock->bind_param(
            "iii",
            $quantity,
            $productId,
            $quantity
        );

        $updateStock->execute();

        if ($updateStock->affected_rows !== 1) {
            throw new Exception("Stock update failed.");
        }

        // Prepare bill details
        $billId = $data["bill_id"];
        $subtotal = (float)$data["subtotal"];
        $gst = (float)$data["gst"];
        $grandTotal = (float)$data["grand_total"];

        // Save bill item in sales table
        $insertBill->bind_param(
            "ssidddd",
            $billId,
            $productName,
            $quantity,
            $price,
            $subtotal,
            $gst,
            $grandTotal
        );

        $insertBill->execute();
    }

    // Save all changes permanently
    $conn->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Bill saved and stock updated successfully."
    ]);

} catch (Exception $error) {

    // Undo all changes if any operation fails
    $conn->rollback();

    echo json_encode([
        "status" => "error",
        "message" => $error->getMessage()
    ]);

}

// Close database resources
if (isset($stockQuery)) {
    $stockQuery->close();
}

if (isset($updateStock)) {
    $updateStock->close();
}

if (isset($insertBill)) {
    $insertBill->close();
}

$conn->close();

?>
