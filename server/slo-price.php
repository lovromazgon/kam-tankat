<?php
//accept CORS requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header("Access-Control-Allow-Headers: X-Requested-With");

$url = 'http://www.petrol.si/api/fuel_prices.json';

$options = array(
        'http' => array(
        'method'  => 'GET'
    )
);

$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);

echo($result);

?>
