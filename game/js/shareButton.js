//social platform sharing buttons
share_button();
	
function share_button(){
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
	var host_url = document.location.href;
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
				window.open(twitterShareURL+"url="+host_url);
				break;
			case "facebook":
				window.open(fbShareURL+host_url);
				break;
			case "linkedin":
				window.open(linkedinShareURL+"url="+host_url);
				break;
			case "weibo":
				window.open(weiboShareURL+"url="+host_url);
				break;
		}	
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





