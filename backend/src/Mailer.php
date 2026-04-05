<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

final class Mailer
{
    private static function make(): PHPMailer
    {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = $_ENV['SMTP_HOST'] ?? getenv('SMTP_HOST') ?: 'mailhog';
        $mail->Port       = (int)($_ENV['SMTP_PORT'] ?? getenv('SMTP_PORT') ?: 1025);
        $mail->SMTPAuth   = false;
        $user = $_ENV['SMTP_USER'] ?? getenv('SMTP_USER') ?: '';
        $pass = $_ENV['SMTP_PASS'] ?? getenv('SMTP_PASS') ?: '';
        if ($user !== '') {
            $mail->SMTPAuth = true;
            $mail->Username = $user;
            $mail->Password = $pass;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        }
        $mail->setFrom(
            $_ENV['SMTP_FROM'] ?? getenv('SMTP_FROM') ?: 'noreply@dreamgarden.ch',
            $_ENV['SMTP_NAME'] ?? getenv('SMTP_NAME') ?: 'Dream Garden Maid Café'
        );
        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';
        return $mail;
    }

    public static function sendVerification(string $toEmail, string $toName, string $token): void
    {
        $appUrl = $_ENV['APP_URL'] ?? getenv('APP_URL') ?: 'http://localhost:5173';
        $link   = $appUrl . '/verify-email?token=' . urlencode($token);

        $mail = self::make();
        $mail->addAddress($toEmail, $toName);
        $mail->Subject = 'Deine E-Mail-Adresse bestätigen – Dream Garden Maid Café';
        $mail->Body    = <<<HTML
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
              <h2 style="color:#b5838d">Dream Garden Maid Café</h2>
              <p>Hallo {$toName}!</p>
              <p>Bitte bestätige deine E-Mail-Adresse, indem du auf den Button klickst:</p>
              <p style="text-align:center;margin:32px 0">
                <a href="{$link}" style="background:#b5838d;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">
                  E-Mail bestätigen
                </a>
              </p>
              <p style="color:#888;font-size:13px">Der Link ist 24 Stunden gültig.</p>
            </div>
        HTML;
        $mail->AltBody = "Bitte bestätige deine E-Mail: $link";
        $mail->send();
    }

    public static function sendPasswordReset(string $toEmail, string $toName, string $token): void
    {
        $appUrl = $_ENV['APP_URL'] ?? getenv('APP_URL') ?: 'http://localhost:5173';
        $link   = $appUrl . '/reset-password?token=' . urlencode($token);

        $mail = self::make();
        $mail->addAddress($toEmail, $toName);
        $mail->Subject = 'Passwort zurücksetzen – Dream Garden Maid Café';
        $mail->Body    = <<<HTML
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
              <h2 style="color:#b5838d">Dream Garden Maid Café</h2>
              <p>Hallo {$toName}!</p>
              <p>Du hast das Zurücksetzen deines Passworts beantragt. Klicke auf den Button:</p>
              <p style="text-align:center;margin:32px 0">
                <a href="{$link}" style="background:#b5838d;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">
                  Passwort zurücksetzen
                </a>
              </p>
              <p style="color:#888;font-size:13px">Der Link ist 1 Stunde gültig. Falls du das nicht beantragt hast, ignoriere diese E-Mail.</p>
            </div>
        HTML;
        $mail->AltBody = "Passwort zurücksetzen: $link";
        $mail->send();
    }

    public static function sendOrderConfirmation(string $toEmail, string $toName, array $order): void
    {
        $mail = self::make();
        $mail->addAddress($toEmail, $toName);
        $mail->Subject = "Bestellbestätigung #" . $order['id'] . " – Dream Garden Maid Café";

        $itemRows = '';
        foreach ($order['items'] as $item) {
            $itemRows .= '<tr><td style="padding:6px 0">' . htmlspecialchars($item['product_name'])
                . ' × ' . $item['quantity'] . '</td>'
                . '<td style="text-align:right;padding:6px 0">CHF '
                . number_format($item['unit_price'] * $item['quantity'], 2) . '</td></tr>';
        }

        $mail->Body = <<<HTML
            <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px">
              <h2 style="color:#b5838d">Dream Garden Maid Café</h2>
              <p>Hallo {$toName}!</p>
              <p>Vielen Dank für deine Bestellung #<strong>{$order['id']}</strong>. Wir bearbeiten sie so schnell wie möglich.</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                {$itemRows}
                <tr style="border-top:1px solid #eee">
                  <td style="padding:8px 0;font-weight:bold">Lieferkosten</td>
                  <td style="text-align:right;padding:8px 0">CHF {$order['delivery_cost']}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:bold;font-size:16px">Total</td>
                  <td style="text-align:right;font-weight:bold;font-size:16px">CHF {$order['total']}</td>
                </tr>
              </table>
              <p>Wir melden uns, sobald dein Paket unterwegs ist!</p>
            </div>
        HTML;
        $mail->AltBody = "Bestellbestätigung #{$order['id']} – Total CHF {$order['total']}";
        $mail->send();
    }
}
