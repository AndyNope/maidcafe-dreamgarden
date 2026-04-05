<?php

declare(strict_types=1);

final class UploadController
{
    private const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    private const MAX_SIZE     = 5 * 1024 * 1024; // 5 MB
    private string $uploadDir;

    public function __construct(private Auth $auth)
    {
        // Use the site root `uploads/` directory so files are served at `/uploads/...`
        // When `index.php` lives in `api/` during our dist deployment, ROOT_DIR points
        // to the site root (httpdocs). Writing to ROOT_DIR.'/uploads' ensures the
        // public URL `/uploads/...` maps correctly and avoids storing files under
        // `public/uploads` which previously caused mismatches on prod.
        $this->uploadDir = ROOT_DIR . '/uploads/';
    }

    public function upload(): never
    {
        $this->auth->requireAuth();

        if (empty($_FILES['file'])) {
            json_response(['error' => 'No file uploaded'], 400);
        }

        $file = $_FILES['file'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            json_response(['error' => 'Upload error: ' . $file['error']], 400);
        }

        if ($file['size'] > self::MAX_SIZE) {
            json_response(['error' => 'File too large (max 5 MB)'], 413);
        }

        // Verify MIME type from actual file content (not user-supplied header)
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime  = $finfo->file($file['tmp_name']);

        if (!in_array($mime, self::ALLOWED_MIME, true)) {
            json_response(['error' => 'Invalid file type. Only JPEG, PNG, GIF, WebP allowed.'], 415);
        }

        $ext      = match ($mime) {
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/gif'  => 'gif',
            'image/webp' => 'webp',
        };

        // Use a random filename to prevent enumeration
        $filename = bin2hex(random_bytes(16)) . '.' . $ext;
        $destPath = $this->uploadDir . $filename;

        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }

        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            json_response(['error' => 'Failed to save file'], 500);
        }

        $publicUrl = '/uploads/' . $filename;
        json_response(['url' => $publicUrl], 201);
    }
}
