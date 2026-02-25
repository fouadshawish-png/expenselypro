<?php
require_once __DIR__ . '/../admin/includes/db.php';
require_once __DIR__ . '/../admin/includes/utils.php';

$stmt = $conn->prepare("SELECT title, slug, excerpt, created_at, featured_image FROM posts WHERE status='published' ORDER BY created_at DESC");
$stmt->execute();
$posts = $stmt->get_result();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>المقالات | ExpenselyPro</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
<div class="container py-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="m-0">المقالات</h2>
    </div>
    <div class="row g-4">
        <?php while($row = $posts->fetch_assoc()): ?>
            <div class="col-md-6">
                <div class="card h-100 shadow-sm">
                    <?php if(!empty($row['featured_image'])): ?>
                        <img src="/<?php echo htmlspecialchars($row['featured_image']); ?>" class="card-img-top" alt="<?php echo e($row['title']); ?>">
                    <?php endif; ?>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title"><?php echo e($row['title']); ?></h5>
                        <?php if(!empty($row['excerpt'])): ?>
                            <p class="card-text text-muted"><?php echo e($row['excerpt']); ?></p>
                        <?php endif; ?>
                        <div class="mt-auto d-flex justify-content-between align-items-center">
                            <small class="text-muted"><?php echo e($row['created_at']); ?></small>
                            <a class="btn btn-primary btn-sm" href="/cms/<?php echo urlencode($row['slug']); ?>">قراءة</a>
                        </div>
                    </div>
                </div>
            </div>
        <?php endwhile; ?>
    </div>
</div>
</body>
</html>
