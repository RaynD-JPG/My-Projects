<?php
require_once 'storage.php';

session_start();

// helpers for JSON files
function loadJson($filename) {
    if (!file_exists($filename)) {
        file_put_contents($filename, '[]');
    }
    $data = file_get_contents($filename);
    return json_decode($data, true) ?: [];
}

function saveJson($filename, $data) {
    file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT));
}

$carsFile = 'cars.json';
$usersFile = 'users.json';
$bookingsFile = 'bookings.json';

$cars = loadJson($carsFile);
$users = loadJson($usersFile);
$bookings = loadJson($bookingsFile);

// Checking if user is an  admin
function isAdmin() {
    return isset($_SESSION['username']) && $_SESSION['username'] === 'admin';
}

// registration part
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['register'])) {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $errors = [];

    if (strlen($username) < 3) $errors[] = "Username must be at least 3 characters long.";
    if (!$password) $errors[] = "Password is required.";

    if (empty($errors)) {
        foreach ($users as $user) {
            if ($user['username'] === $username) {
                $errors[] = "Username already exists.";
                break;
            }
        }
        if (empty($errors)) {
            $users[] = [
                'username' => $username,
                'password' => password_hash($password, PASSWORD_DEFAULT),
            ];
            saveJson($usersFile, $users);
            $successMessage = "Registration successful. Please log in.";
        }
    }
}

// login part
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $errors = [];

    if (!$username) $errors[] = "Username is required.";
    if (!$password) $errors[] = "Password is required.";

    if (empty($errors)) {
        foreach ($users as $user) {
            if ($user['username'] === $username && password_verify($password, $user['password'])) {
                $_SESSION['username'] = $username;
                header("Location: index.php");
                exit;
            }
        }
        $errors[] = "Invalid credentials.";
    }
}

// Handle Logout
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_destroy();
    header("Location: index.php");
    exit;
}

// booking part
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['book_car'])) {
    if (!isset($_SESSION['username'])) {
        header("Location: index.php?page=login");
        exit;
    }

    $carId = $_POST['car_id'] ?? '';
    $startDate = $_POST['start_date'] ?? '';
    $endDate = $_POST['end_date'] ?? '';
    $errors = [];

    if (!$startDate || !$endDate) $errors[] = "Both start and end dates are required.";
    if (strtotime($startDate) > strtotime($endDate)) $errors[] = "Start date must be before end date.";

    if (empty($errors)) {
        $bookings[] = [
            'username' => $_SESSION['username'],
            'car_id' => $carId,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ];
        saveJson($bookingsFile, $bookings);
        $successMessage = "Booking successfully saved.";
    }
}

// Handle Car Deletion
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_car']) && isAdmin()) {
    $carId = $_POST['car_id'] ?? '';
    $cars = array_filter($cars, fn($c) => $c['id'] != $carId);
    $bookings = array_filter($bookings, fn($b) => $b['car_id'] != $carId);
    saveJson($carsFile, $cars);
    saveJson($bookingsFile, $bookings);
    header("Location: index.php?page=admin");
    exit;
}

// deleting booking
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_booking']) && isAdmin()) {
    $bookingId = $_POST['booking_id'] ?? '';
    $bookings = array_filter($bookings, fn($b) => $b['car_id'] != $bookingId);
    saveJson($bookingsFile, $bookings);
    header("Location: index.php?page=admin");
    exit;
}

// Car modification
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['edit_car']) && isAdmin()) {
    $carId = $_POST['car_id'] ?? '';
    foreach ($cars as &$car) {
        if ($car['id'] == $carId) {
            $car['brand'] = $_POST['brand'] ?? $car['brand'];
            $car['model'] = $_POST['model'] ?? $car['model'];
            $car['year'] = $_POST['year'] ?? $car['year'];
            $car['daily_price_huf'] = $_POST['price'] ?? $car['daily_price_huf'];
            $car['image'] = $_POST['image'] ?? $car['image'];
            break;
        }
    }
    saveJson($carsFile, $cars);
    header("Location: index.php?page=admin");
    exit;
}

// Handle Add Car (Admin Only)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_car']) && isAdmin()) {
    $brand = $_POST['brand'] ?? '';
    $model = $_POST['model'] ?? '';
    $year = $_POST['year'] ?? '';
    $price = $_POST['price'] ?? '';
    $image = $_POST['image'] ?? '';
    $errors = [];

    if (strlen($brand) < 3) $errors[] = "Car brand must be at least 3 characters long.";
    if (!$model) $errors[] = "Model is required.";
    if (!$year || !is_numeric($year)) $errors[] = "Valid year is required.";
    if (!$price || !is_numeric($price)) $errors[] = "Valid price is required.";
    if (!$image) $errors[] = "Image URL is required.";

    if (empty($errors)) {
        $cars[] = [
            'id' => count($cars) + 1,
            'brand' => htmlspecialchars($brand),
            'model' => htmlspecialchars($model),
            'year' => (int)$year,
            'daily_price_huf' => (int)$price,
            'image' => htmlspecialchars($image),
        ];
        saveJson($carsFile, $cars);
        $successMessage = "Car successfully added.";
    }
}

// Display homepage or others
$page = $_GET['page'] ?? 'home';
$id = $_GET['id'] ?? null;
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Car Listing</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">

<div class="container my-5">
    <nav class="mb-4">
        <ul class="nav nav-pills">
            <li class="nav-item"><a class="nav-link <?php echo $page === 'home' ? 'active' : ''; ?>" href="index.php">Home</a></li>
            <?php if (isset($_SESSION['username'])): ?>
                <li class="nav-item"><a class="nav-link <?php echo $page === 'profile' ? 'active' : ''; ?>" href="index.php?page=profile">My Profile</a></li>
                <?php if (isAdmin()): ?>
                    <li class="nav-item"><a class="nav-link <?php echo $page === 'admin' ? 'active' : ''; ?>" href="index.php?page=admin">Admin</a></li>
                <?php endif; ?>
                <li class="nav-item"><a class="nav-link" href="index.php?action=logout">Logout</a></li>
            <?php else: ?>
                <li class="nav-item"><a class="nav-link <?php echo $page === 'login' ? 'active' : ''; ?>" href="index.php?page=login">Login</a></li>
                <li class="nav-item"><a class="nav-link <?php echo $page === 'register' ? 'active' : ''; ?>" href="index.php?page=register">Register</a></li>
            <?php endif; ?>
        </ul>
    </nav>

    <?php if ($page === 'home'): ?>
        <h1 class="text-center mb-4">Car Listing</h1>

        <form method="get" action="" class="mb-4">
            <div class="row g-3">
                <div class="col-md-4">
                    <input type="text" name="filter_name" class="form-control" placeholder="Search by name" value="<?php echo htmlspecialchars($_GET['filter_name'] ?? ''); ?>">
                </div>
                <div class="col-md-3">
                    <input type="date" name="start_date" class="form-control" placeholder="Start Date" value="<?php echo htmlspecialchars($_GET['start_date'] ?? ''); ?>">
                </div>
                <div class="col-md-3">
                    <input type="date" name="end_date" class="form-control" placeholder="End Date" value="<?php echo htmlspecialchars($_GET['end_date'] ?? ''); ?>">
                </div>
                <div class="col-md-2">
                    <button type="submit" class="btn btn-primary w-100">Filter</button>
                </div>
            </div>
        </form>

        <div class="row">
            <?php
            $filterName = $_GET['filter_name'] ?? '';
            $filterStartDate = $_GET['start_date'] ?? '';
            $filterEndDate = $_GET['end_date'] ?? '';

            foreach ($cars as $car) {
                $isAvailable = true;
                if ($filterStartDate && $filterEndDate) {
                    foreach ($bookings as $booking) {
                        if ($booking['car_id'] == $car['id'] &&
                            (strtotime($filterStartDate) <= strtotime($booking['end_date']) &&
                             strtotime($filterEndDate) >= strtotime($booking['start_date']))) {
                            $isAvailable = false;
                            break;
                        }
                    }
                }

                if ($filterName && stripos($car['brand'], $filterName) === false) continue;
                if (!$isAvailable) continue;

                echo "<div class='col-md-4 mb-4'>
                        <div class='card'>
                            <img src='{$car['image']}' class='card-img-top' alt='{$car['brand']}'>
                            <div class='card-body'>
                                <h5 class='card-title'>{$car['brand']} - {$car['model']}</h5>
                                <p class='card-text'>Year: {$car['year']}</p>
                                <p class='card-text'>Price: {$car['daily_price_huf']} HUF</p>
                                <a href='?page=details&id={$car['id']}' class='btn btn-primary'>View Details</a>
                            </div>
                        </div>
                    </div>";
            }
            ?>
        </div>

    <?php elseif ($page === 'details' && $id): ?>
        <?php
        $car = array_values(array_filter($cars, fn($c) => $c['id'] == $id))[0] ?? null;
        if ($car): ?>
            <h1 class="text-center mb-4">Car Details</h1>
            <div class="card mx-auto" style="max-width: 600px;">
                <img src="<?php echo $car['image']; ?>" class="card-img-top" alt="<?php echo $car['brand']; ?>">
                <div class="card-body">
                    <h2 class="card-title text-center"><?php echo $car['brand'] . " " . $car['model']; ?></h2>
                    <p class="card-text">Year: <?php echo $car['year']; ?></p>
                    <p class="card-text">Price: <?php echo $car['daily_price_huf']; ?> HUF</p>
                    <?php if (isset($successMessage)): ?>
                        <div class="alert alert-success">Booking successful!</div>
                    <?php endif; ?>
                    <?php if (!empty($errors)): ?>
                        <div class="alert alert-danger">
                            <?php foreach ($errors as $error): ?>
                                <p><?php echo $error; ?></p>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                    <form method="post" action="">
                        <input type="hidden" name="car_id" value="<?php echo $car['id']; ?>">
                        <div class="mb-3">
                            <label for="start_date" class="form-label">Start Date:</label>
                            <input type="date" name="start_date" id="start_date" class="form-control">
                        </div>
                        <div class="mb-3">
                            <label for="end_date" class="form-label">End Date:</label>
                            <input type="date" name="end_date" id="end_date" class="form-control">
                        </div>
                        <button type="submit" name="book_car" class="btn btn-success">Book Now</button>
                    </form>
                </div>
            </div>
        <?php else: ?>
            <p class="text-center">Car not found.</p>
            <a href="index.php" class="btn btn-secondary">Back to Homepage</a>
        <?php endif; ?>

    <?php elseif ($page === 'login'): ?>
        <h1 class="text-center mb-4">Login</h1>
        <form method="post" action="" class="mx-auto" style="max-width: 400px;">
            <div class="mb-3">
                <label for="username" class="form-label">Username:</label>
                <input type="text" name="username" id="username" class="form-control" value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>">
            </div>
            <div class="mb-3">
                <label for="password" class="form-label">Password:</label>
                <input type="password" name="password" id="password" class="form-control">
            </div>
            <button type="submit" name="login" class="btn btn-primary">Login</button>
        </form>
        <?php if (!empty($errors)): ?>
            <div class="alert alert-danger mt-3">
                <?php foreach ($errors as $error): ?>
                    <p><?php echo $error; ?></p>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

    <?php elseif ($page === 'register'): ?>
        <h1 class="text-center mb-4">Register</h1>
        <form method="post" action="" class="mx-auto" style="max-width: 400px;">
            <div class="mb-3">
                <label for="username" class="form-label">Username:</label>
                <input type="text" name="username" id="username" class="form-control" value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>">
            </div>
            <div class="mb-3">
                <label for="password" class="form-label">Password:</label>
                <input type="password" name="password" id="password" class="form-control">
            </div>
            <button type="submit" name="register" class="btn btn-success">Register</button>
        </form>
        <?php if (isset($successMessage)): ?>
            <div class="alert alert-success mt-3"><?php echo $successMessage; ?></div>
        <?php endif; ?>
        <?php if (!empty($errors)): ?>
            <div class="alert alert-danger mt-3">
                <?php foreach ($errors as $error): ?>
                    <p><?php echo $                    $error; ?></p>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

    <?php elseif ($page === 'profile'): ?>
        <h1 class="text-center mb-4">My Profile</h1>
        <h3>Your Bookings:</h3>
        <ul class="list-group">
            <?php foreach ($bookings as $booking): ?>
                <?php if ($booking['username'] === $_SESSION['username']): ?>
                    <?php $car = array_filter($cars, fn($c) => $c['id'] == $booking['car_id']); ?>
                    <?php $car = array_values($car)[0] ?? null; ?>
                    <?php if ($car): ?>
                        <li class="list-group-item">
                            <strong><?php echo $car['brand'] . ' ' . $car['model']; ?></strong><br>
                            From: <?php echo $booking['start_date']; ?><br>
                            To: <?php echo $booking['end_date']; ?>
                        </li>
                    <?php endif; ?>
                <?php endif; ?>
            <?php endforeach; ?>
        </ul>

    <?php elseif ($page === 'admin' && isAdmin()): ?>
        <h1 class="text-center mb-4">Admin Dashboard</h1>
        <h3>Add New Car</h3>
        <form method="post" action="" class="mb-4">
            <div class="mb-3">
                <label for="brand" class="form-label">Brand:</label>
                <input type="text" name="brand" id="brand" class="form-control" value="<?php echo htmlspecialchars($_POST['brand'] ?? ''); ?>">
            </div>
            <div class="mb-3">
                <label for="model" class="form-label">Model:</label>
                <input type="text" name="model" id="model" class="form-control" value="<?php echo htmlspecialchars($_POST['model'] ?? ''); ?>">
            </div>
            <div class="mb-3">
                <label for="year" class="form-label">Year:</label>
                <input type="number" name="year" id="year" class="form-control" value="<?php echo htmlspecialchars($_POST['year'] ?? ''); ?>">
            </div>
            <div class="mb-3">
                <label for="price" class="form-label">Price (HUF):</label>
                <input type="number" name="price" id="price" class="form-control" value="<?php echo htmlspecialchars($_POST['price'] ?? ''); ?>">
            </div>
            <div class="mb-3">
                <label for="image" class="form-label">Image URL:</label>
                <input type="text" name="image" id="image" class="form-control" value="<?php echo htmlspecialchars($_POST['image'] ?? ''); ?>">
            </div>
            <button type="submit" name="add_car" class="btn btn-success">Add Car</button>
        </form>
        <?php if (isset($successMessage)): ?>
            <div class="alert alert-success mt-3"><?php echo $successMessage; ?></div>
        <?php endif; ?>
        <?php if (!empty($errors)): ?>
            <div class="alert alert-danger mt-3">
                <?php foreach ($errors as $error): ?>
                    <p><?php echo $error; ?></p>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <h3>All Cars</h3>
        <div class="row">
            <?php foreach ($cars as $car): ?>
                <div class="col-md-4 mb-4">
                    <div class="card">
                        <img src="<?php echo $car['image']; ?>" class="card-img-top" alt="<?php echo $car['brand']; ?>">
                        <div class="card-body">
                            <h5 class="card-title"><?php echo $car['brand'] . ' ' . $car['model']; ?></h5>
                            <p class="card-text">Year: <?php echo $car['year']; ?></p>
                            <p class="card-text">Price: <?php echo $car['daily_price_huf']; ?> HUF</p>
                            <form method="post" action="" class="d-inline">
                                <input type="hidden" name="car_id" value="<?php echo $car['id']; ?>">
                                <button type="submit" name="delete_car" class="btn btn-danger btn-sm">Delete</button>
                            </form>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <h3>All Bookings</h3>
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Car</th>
                    <th>User</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($bookings as $index => $booking): ?>
                    <?php $car = array_filter($cars, fn($c) => $c['id'] == $booking['car_id']); ?>
                    <?php $car = array_values($car)[0] ?? null; ?>
                    <?php if ($car): ?>
                        <tr>
                            <td><?php echo $index + 1; ?></td>
                            <td><?php echo $car['brand'] . ' ' . $car['model']; ?></td>
                            <td><?php echo $booking['username']; ?></td>
                            <td><?php echo $booking['start_date']; ?></td>
                            <td><?php echo $booking['end_date']; ?></td>
                            <td>
                                <form method="post" action="">
                                    <input type="hidden" name="booking_id" value="<?php echo $booking['car_id']; ?>">
                                    <button type="submit" name="delete_booking" class="btn btn-danger btn-sm">Delete</button>
                                </form>
                            </td>
                        </tr>
                    <?php endif; ?>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>

