<?php
require_once __DIR__ . '/../admin/includes/db.php';

$slug = $_GET['slug'] ?? '';
$slug = trim($slug);

$stmt = $conn->prepare("SELECT title, content, excerpt, created_at, featured_image FROM posts WHERE slug=? AND status='published' LIMIT 1");
$stmt->bind_param("s", $slug);
$stmt->execute();
$post = $stmt->get_result()->fetch_assoc();

if (!$post) {
        http_response_code(404);
        echo "404 - Article not found";
        exit();
}
?>

<!DOCTYPE html>
<html lang="ar">
<head>
<meta charset="UTF-8">
<title><?= htmlspecialchars($post['title']) ?> | ExpenselyPro</title>
<link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>

<?php include $_SERVER['DOCUMENT_ROOT'].'/header.html'; ?>

<main class="page">
    <section class="section section--compact">
        <div class="container">
            <article class="post">

                <div class="breadcrumb">
                    <a href="/">الرئيسية</a> ›
                    <a href="/blog/">المدونة</a> ›
                    <?= htmlspecialchars($post['title']) ?>
                </div>

                <h1><?= htmlspecialchars($post['title']) ?></h1>

                <p class="post-meta">
                    <?= date("F j, Y", strtotime($post['created_at'])) ?>
                </p>

                <?php if(!empty($post['featured_image'])): ?>
                    <img src="/<?= $post['featured_image'] ?>" 
                             alt="<?= htmlspecialchars($post['title']) ?>" 
                             loading="lazy"
                             class="post-image post-image--wide">
                <?php endif; ?>

                <div class="post-content">
                    <?= $post['content'] ?>
                </div>

            </article>
        </div>
    </section>
</main>

<?php include $_SERVER['DOCUMENT_ROOT'].'/footer.html'; ?>

</body>
</html>
