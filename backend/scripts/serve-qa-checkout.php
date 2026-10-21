<?php

$root = dirname(__DIR__);
$database = $root.DIRECTORY_SEPARATOR.'storage'.DIRECTORY_SEPARATOR.'framework'.DIRECTORY_SEPARATOR.'testing'.DIRECTORY_SEPARATOR.'beity-qa-checkout.sqlite';
$normalized = str_replace('\\', '/', $database);

if (is_file($root.DIRECTORY_SEPARATOR.'.env')) {
    fwrite(STDERR, "Refusing to start because backend/.env exists.\n");
    exit(1);
}
if (! str_ends_with($normalized, 'storage/framework/testing/beity-qa-checkout.sqlite')) {
    fwrite(STDERR, "Refusing to use an unexpected database path.\n");
    exit(1);
}

if (! is_dir(dirname($database))) {
    mkdir(dirname($database), 0777, true);
}
if (is_file($database)) {
    unlink($database);
}

$environment = [
    'APP_ENV' => 'local',
    'APP_DEBUG' => 'true',
    'APP_KEY' => 'base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    'APP_URL' => 'http://127.0.0.1:8000',
    'DB_CONNECTION' => 'sqlite',
    'DB_DATABASE' => $database,
    'DB_URL' => '',
    'CACHE_STORE' => 'file',
    'SESSION_DRIVER' => 'file',
    'QUEUE_CONNECTION' => 'sync',
    'MAIL_MAILER' => 'log',
    'FILESYSTEM_DISK' => 'local',
    'BOSTA_API_KEY' => '',
    'BOSTA_BASE_URL' => 'https://bosta.invalid',
    'LOG_CHANNEL' => 'stderr',
];
foreach ($environment as $name => $value) {
    putenv($name.'='.$value);
    $_ENV[$name] = $value;
    $_SERVER[$name] = $value;
}

fwrite(STDERR, "QA database: {$normalized}\n");

function qaCommand(string $root, string $command): void
{
    $status = 0;
    passthru(PHP_BINARY.' '.escapeshellarg($root.DIRECTORY_SEPARATOR.'artisan').' '.$command, $status);
    if ($status !== 0) {
        exit($status);
    }
}

qaCommand($root, 'migrate --force --no-interaction');
qaCommand($root, 'db:seed --class=Database\\Seeders\\QaCheckoutSeeder --force --no-interaction');
qaCommand($root, 'serve --host=127.0.0.1 --port=8000 --no-reload');
