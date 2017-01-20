//social platform sharing buttons
(function (){
	var shareDiv = document.getElementById("share");

	//list of sharers used by different platforms
	var weiboShareURL = "http://service.weibo.com/share/share.php?";
	var fbShareURL = "https://www.facebook.com/sharer/sharer.php?u=";
	var twitterShareURL = "https://twitter.com/intent/tweet?";
	var linkedinShareURL = "https://www.linkedin.com/shareArticle?mini=true&";
	
	//obtain different platform's icon ID 
	var twitter = document.getElementById("twitter");
	var facebook = document.getElementById("facebook");
	var linkedin = document.getElementById("linkedin");
	var weibo = document.getElementById("weibo");
	var host_url_secure = "https://roosterrun.wlt.com/game/";
	var host_url = "http://roosterrun.wlt.com/game/";
	//console.log(host_url);

	shareDiv.addEventListener("click", openWebPage);

	// detect if is wechat
	if(isWeiXin()){
		//do something
		//document.write("<h1>Hello World!</h1><p>Have a nice day!</p>");	
	}

	function openWebPage(e){
		//console.log(e.target.id);
		
		switch (e.target.id) {
			case "twitter":
				window.open(twitterShareURL+"url="+host_url+"&hashtags=RoosterRun&text=Happy Chinese New Year from Williams Lea Tag");
				break;
			case "facebook":
				window.open(fbShareURL+host_url_secure);
				break;
			case "linkedin":
				window.open(linkedinShareURL+"url="+host_url_secure);
				break;
			case "weibo":
				window.open(weiboShareURL+"url="+host_url);
				break;
		}	
	}

	function isWeiXin(){ 
		var ua = window.navigator.userAgent.toLowerCase(); 
		if(ua.match(/MicroMessenger/i) == 'micromessenger'){ 
			return true; 
		} else{ 
			return false; 
		} 
	} 

})();






