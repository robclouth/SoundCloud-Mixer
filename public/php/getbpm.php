<?php
header('Access-Control-Allow-Origin: *');


	@mysql_connect('jungle.threechords.org', 'musichackday', 'crazydrink') or die("The site database appears to be down."); 
	
	mysql_select_db('musichackday2011');

	$result = mysql_query("SELECT id, bpm FROM trackInfo WHERE id IN (" . $_GET['ids'] . ")") or die(mysql_error());
	while($row = mysql_fetch_array($result, MYSQL_NUM)){
		echo $row[0] . "-" . $row[1] . ",";
	}
 
?>
