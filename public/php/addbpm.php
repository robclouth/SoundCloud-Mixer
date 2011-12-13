<?php
	@mysql_connect('jungle.threechords.org', 'musichackday', 'crazydrink') or die("The site database appears to be down."); 
	
	mysql_select_db('musichackday2011');
	
	$id = $_GET['id'];
	$bpm = $_GET['bpm'];
	
	$sql = "SELECT id FROM trackInfo WHERE id = '$id'";
	$result = mysql_query($sql) or die(mysql_error());

	if (mysql_num_rows($result) == 0) {
		mysql_query("INSERT INTO trackInfo values('$id', '$bpm' )") or die(mysql_error());
	}else {
		mysql_query("UPDATE trackInfo SET bpm = '$bpm' WHERE id = '$id'") or die(mysql_error());
	}
 
?>
