
<?php

// Set response format to JSON
header("Content-Type: application/json");

// Include database connection
include "db.php";

// Get all saved sales records
$sql = "SELECT * FROM sales ORDER BY id DESC";

// Execute SQL query
$result = $conn->query($sql);

// Create an array for sales records
$sales = [];

// Fetch sales records from database
if ($result) {

    while ($row = $result->fetch_assoc()) {
        $sales[] = $row;
    }

}

// Return sales records as JSON
echo json_encode($sales);

// Close database connection
$conn->close();

?>
