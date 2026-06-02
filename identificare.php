<?php
/**
 * FĂȘIER: identificare.php
 * Rol: Proxy securizat pentru API-ul PlantNet
 */

// 1. Cheia ta API rămâne în siguranță pe server
$PLANTNET_KEY = '2b10Qq1LQb6AOnIw2QXcWdMqOe';
$url = "https://my-api.plantnet.org/v2/identify/all?api-key=" . $PLANTNET_KEY . "&lang=ro&nb-results=5";

// 2. Verificăm dacă s-a trimis o imagine din formular
if (!isset($_FILES['images'])) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(["message" => "Nicio imagine nu a fost trimisă de la cameră."]);
    exit;
}

$file = $_FILES['images'];

// 3. Inițializăm cererea cURL către PlantNet
$ch = curl_init();

// Creăm obiectul CURLFile necesar pentru upload-ul imaginii în PHP
$cfile = new CURLFile($file['tmp_name'], $file['type'], $file['name']);

$data = [
    'images' => $cfile,
    'organs' => 'auto'
];

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

// Executăm cererea
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

// 4. Trimitem răspunsul primit înapoi la aplicația din browser
http_response_code($httpCode);
header('Content-Type: application/json');
echo $response;
?>
