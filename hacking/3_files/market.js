











var slots = [];

var idIter = 0;
function addMessageFromMe(userName, message) {
	var elem = $('#chatMemb_' + userName + ' .textChatDisplay');
	var elid = 'elid_' + idIter++;
	elem.html(elem.html() + '<div  class="messageContainer"><p id="' + elid + '"  class="messageFromMe singleMessage">&nbsp;<\/p><\/div>');

   	$('#' + elid).html(message);
   	
}


function escapeHtml(message) {

	var escaped = $("#converterForCharacters").text(message).html();
	return escaped;
}

function addMessageFromRemote(userName, message) { 
	var elem = $('#chatMemb_' + userName + ' .textChatDisplay');
	
	var elid = 'elid_' + idIter++;
	elem.html(elem.html() + '<div class="messageContainer"><p id="' + elid + '" class="messageFromRemote singleMessage">&nbsp;<\/p><\/div>');
   	$('#' + elid).html(message);
   	
 
	elem.scrollTop = 9999999;
}


function scrollToBottom(userName) {

	var elem = $('#chatMemb_' + userName + ' .textChatDisplay');
	var shei = elem[0].scrollHeight;
	elem.scrollTop(shei);
}

function sendMessage(textData, talkingToUserName, chatMembId) { 
	$.ajax({type: "POST", 
			url: "./ajax" ,
			data: {chatMessage: textData, 
				to: talkingToUserName,
				c : 'send',
				t : 'chat'} 
		 }).done(function( data ) {
			var d = JSON.parse(data);
			if (d.success) {
				var message = escapeHtml( textData);
				addMessageFromMe(talkingToUserName, message);
			} else {
				var elem = $('#' + chatMembId + ' .textChatDisplay');
				elem.html(elem.html() + "<div class='error'>" + d.reason + '<\/div>');
			}
		   	scrollToBottom(talkingToUserName); 
		});
}


function fillConversationHistory(talkingToUserName, onFinishedCallback) {
	$('#chatMemb_' + talkingToUserName ).addClass('chatHistoryLoading');
	$.ajax({ url: "./ajax" ,
		data: {
			t : 'chat',
			c : 'history',
			remote: talkingToUserName} 
	 }).done(function( data ) {
		var d = JSON.parse(data);

		for(var i = 0;i < d.length;i++) {
			var m = d[i];
			if (m.fromMe) {
				addMessageFromMe(talkingToUserName, m.message);
			} else {
				addMessageFromRemote(talkingToUserName, m.message);
			}
		};

	   	scrollToBottom(talkingToUserName); 
	   	
		if (onFinishedCallback) {
			onFinishedCallback();
		}

		$('#chatMemb_' + talkingToUserName ).removeClass('chatHistoryLoading');
	});
}


function talkTo(userName) {
	var chatMembId = "chatMemb_" + userName;
	var filledHistory = false;

	if ($('#' + chatMembId).length == 0) {
		// creating new tab
		var slotNumber = 0; 
		for(;slots[slotNumber] && slotNumber < 3;slotNumber++) {};
		slots[slotNumber] = true;
		var newRightAlign = 215 + 235 * slotNumber;


	
		
		$(	'	<div id="' + chatMembId + '" class="chatTextContainer " style="display:none"> ' +
			'      <div class="dontwrap chatTitle" >' + 
			'		   <div class="dontwrap chatMemberName">' + ( statX[userName] ? statX[userName] : '' ) 
								+ '<a href="./contactMember?member=' + userName+ '" target="_blank">' + userName + '<\/a><\/div>' +
			'		   <button class="refreshButton" type="button" tabindex="1">&nbsp;<\/button>' +
			'		   <button class="closeButtonClz" type="button" tabindex="1">&nbsp;<\/button>' +
			'	     <\/div>                                                           ' +
			'	  <div class="textChatDisplayContainer"><div class="textChatDisplay"><\/div><\/div>								' +
			'	  <input type="text" class="textChatInput"\/>			 	' +
			'   <\/div>' ).insertAfter( "#chatListContainer" );

		
		var elemContainer = $('#' + chatMembId);
		function closeBox() {
			$('#' + chatMembId).remove();
			slots[slotNumber] = false;
		}

		$('#' + chatMembId + ' .closeButtonClz').click(function(){
			closeBox();
		});
 
		elemContainer.css('right' , newRightAlign + 'px');
		elemContainer.css('display' , 'block');
	
	
		$('#' + chatMembId + ' .textChatInput').keyup(function(e){
			if (e.keyCode == 13) { // enter
				var text = $(this).val();
				if (text.length > 0) {
					sendMessage(text, userName, chatMembId);				
					$(this).val('');
				} 
			} else if (e.keyCode == 27) { // esc 
				closeBox();
			}
		});

		fillConversationHistory(userName);	
		filledHistory = true;


		$('#' + chatMembId + ' .refreshButton').click(function(e) {

			$('#' + chatMembId + ' .textChatDisplay').html('');
			fillConversationHistory(userName);	
		});


		$('#' + chatMembId ).click(function(){
			$('#' + chatMembId + ' .textChatInput').focus();
 			$('#' + chatMembId + ' .chatTitle.messageNotification ' ).removeClass('messageNotification');
			titleWithNewMessage = null;
		});

		
	}
	
	$('#' + chatMembId + ' .textChatInput').focus();
	return filledHistory;
}


function playIncomingSound() {
	if (!playSounds) {
		return;
	}
	var audio = new Audio("img/you_have_got_mail.mp3");
	audio.play();
}


var messageTimeDate = 0;

function incMessageChecker() {
	$.ajax({ url: "./ajax" ,
		data: {t : 'chat',
			c : 'check',
			m : messageTimeDate
			} 
	 })
	.done(function( data ) {
		var d = JSON.parse(data);
		if (d.incoming) {
			var loadingHistory = talkTo(d.from);
			if (!loadingHistory) {
			  addMessageFromRemote( d.from, d.message);
			  scrollToBottom(d.from); 
			}
			messageTimeDate = d.tm;
			if (!d.read) {
				playIncomingSound();
				titleWithNewMessage = $('#chatMemb_' + d.from + " .chatTitle");
			}
		}
	});
}





var isBuddyListShown = false;

var statX = [];

var useDebug = false;

function updateBuddyList() {
	var debugUrl = "http://194.9.94.82/ajax?t=chat&c=buddies";
	var usedUrl = useDebug ? debugUrl : "./ajax?t=chat&c=buddies";
	$.ajax({ url: usedUrl  })
		.done(function( data ) {
			var d = JSON.parse(data);
			if (d.length > 0) {
				var htm = '';
				for (var i in d) {
					statX[d[i].userName] = d[i].status;
					htm += '<div class="buddy dontwrap" id="buddyAround_'  +   d[i].userName 
						 + '" onclick="talkTo(\'' + d[i].userName + '\')">' + d[i].status +  d[i].userName  + '<\/div>';
				}
				$('#chatListBuddies').html(htm);
				
				$('#chatListContainer').css('display' , 'block');
			} else {
				$('#chatListContainer').css('display' , 'none');
			}
		});
}


var originalTitle = null;
var displayStatusChk = false;
var titleWithNewMessage = null;

function messageBlinker() {
	if (originalTitle == null) {
		originalTitle = document.title;
	}

	if (titleWithNewMessage == null) {
		if (originalTitle != document.title) {
			document.title = originalTitle;
		}
	} else {
		console.log("assigned");
		if (displayStatusChk) {
			titleWithNewMessage.addClass("messageNotification");
			document.title = "New message";
		} else {
			titleWithNewMessage.removeClass("messageNotification");
			document.title = originalTitle;
		}
		displayStatusChk = !displayStatusChk;
	}
}


function initCSys(msgTm, intervalBuddyReload, messageCheckInterval) {
	messageTimeDate = msgTm;
	setTimeout(updateBuddyList,1000);
//	setInterval(updateBuddyList, intervalBuddyReload);
 	setInterval(incMessageChecker, messageCheckInterval );
	setInterval(messageBlinker, 1000);
 	
	
	
	$('#chatTitle').click(function() {
		isBuddyListShown = !isBuddyListShown;
		if (isBuddyListShown) {
			$('#chatListContainer').addClass('expanded');
		} else {
			$('#chatListContainer').removeClass('expanded');
		}
		
		$('#chatListBuddies').css('display' , isBuddyListShown ? 'block' : 'none');
	});

	$('.chatTextContainer .closeButtonClz').click(function() {
		$('.chatTextContainer').css('display' , 'none');
	});
	
	
} 




function selectAllInForm(form, master){
	inputs = document.forms[form].getElementsByTagName("input");
	for (i = 0; i < inputs.length; i++) {
		inputs[i].checked = !master.checked;
	}
	master.checked = !master.checked;
}




/*************************************************************************/
/*************************************************************************/
/*************************************************************************/
/*************************************************************************/


function showPImg( offerData,
		vendorData,
		prodId,  imageId , prodTitle,
		sellerOutLink,jsVendorShipsFrom, 
		btcPriceText, localPriceText, shipsFrom, isTrustedSeller,
		domesticCurrencyValue, escrowMethod) {
	if (imageId) {
		$("#productInfoLayer #icnProdImage").css("background-image", 
				"url('./uploadedImage?id=" + imageId + "&type=thumb')"   ) ;
		$("#productInfoLayer #icnProdImage").attr("src", 
				'./uploadedImage?id=' + imageId + '&type=large'   ) ;
		
	} else {
		$("#productInfoLayer #icnProdImage").attr("src", './img/no-image.png'   ) ;
	}

	$("#productInfoLayer .productLink").attr( 'href' , './viewProduct?offer=' + prodId  );
	$("#productInfoLayer .prodTitleContainer a").html( prodTitle );
	$("#productInfoLayer .sellerOutLink").html( sellerOutLink );
	$("#productInfoLayer .sellerOutLink a").click( function(){fadeOut();return true;});
	$("#productInfoLayer .sellerOutLink a").attr( 'target' , '_blank' );
	$("#productInfoLayer #btcValue").html('&#3647;' + btcPriceText);
	if (domesticCurrencyValue) {
		$("#productInfoLayer #localCurrencyValue").css("display", "block");
		$("#productInfoLayer #localCurrencyValue").html(domesticCurrencyValue);
	} else if (localPriceText) {
		$("#productInfoLayer #localCurrencyValue").css("display", "block");
		$("#productInfoLayer #localCurrencyValue").html(localPriceText);
	} else {
		$("#productInfoLayer #localCurrencyValue").css("display", "none");
	}
	
	
	if (shipsFrom) {
		$("#productInfoLayer #shipsFromIcn").css("display", "block");
		$("#productInfoLayer #shipsFrom").html(shipsFrom);
	} else if (jsVendorShipsFrom != null) {
		$("#productInfoLayer #shipsFromIcn").css("display", "block");
		$("#productInfoLayer #shipsFrom").html(jsVendorShipsFrom);
	} else {
		$("#productInfoLayer #shipsFromIcn").css("display", "none");
	}

	if (vendorData.jsVendorShipsTo) {
		$("#productInfoLayer #shipsToIcn").css("display", "block");
		$("#productInfoLayer #shipsTo").html(vendorData.jsVendorShipsTo);
	} else {
		$("#productInfoLayer #shipsToIcn").css("display", "none");
	}
	
	

	if (isTrustedSeller) {
		$("#productInfoLayer #isTrustedSellerContainer").addClass("trusted");
		$("#productInfoLayer #isTrustedSellerContainer").removeClass("untrusted");
	} else {
		$("#productInfoLayer #isTrustedSellerContainer").addClass("untrusted");
		$("#productInfoLayer #isTrustedSellerContainer").removeClass("trusted");
	}
	
	$("#productInfoLayer #escrowMethod").html(escrowMethod);
	
	
	$("#productInfoLayer").css("display", "block");
	
}



function bootShopPage(proddata) {
	for (i = 0; i < proddata.length; i++) {
		var k = function () {
			var item = proddata[i];
			var openDetailsFunc = 
				function(){
				showPImg(item,
						vendors[item.sellerOutLink],
						item.lnk, 
						item.imageId, 
						item.title, 
						vendors[item.sellerOutLink].jsVendorLink, 
						vendors[item.sellerOutLink].jsVendorShipsFrom, 
						item.btcPriceText, 
						item.localPriceText, 
						item.shipsFrom, 
						item.isTrustedSeller,
						item.domesticCurrencyValue,
						item.escrowMethod);
				fadeIn();
				return false;
			};
			$(".productThumbImage_" + item.lid).click(openDetailsFunc);
			$(".shopItem_" + item.lid).click(openDetailsFunc);
		};
		k();
	 } 

	$("#maskLayer").click( fadeOut );
	$("#productInfoLayer .clz").click( fadeOut );

	$("#productInfoLayer #icnProdImage").attr("src", '' ) ;
	
}
function fadeIn(){
	$("#maskLayer").css("opacity", 0);
	$("#maskLayer").css("display", "block");
	$("#maskLayer").animate({
		opacity: 0.4
		},500);
}

function fadeOut() {
	$("#productInfoLayer").css("display", "none");

		// $("#maskLayer").stop(true); 
	$("#maskLayer").animate({
		opacity: 0
		},500, function(){
			$("#maskLayer").css("display", "none");
	});
	

	$("#productInfoLayer #icnProdImage").attr("src", '' ) ;
	$("#productInfoLayer #icnProdImage").css("background-image",  ""   ) ;
}


/////////////////////////////////////////
function onSearchUpdated() {
	var url = './ajax?t=qsearch&escrow='   +
		$('select#escrow').val()         + 
	'&shipsFrom='                          +
		$('select#shippingFrom').val()   +
	'&shippingTo='                          +
		$('select#shippingTo').val()   		+
	'&category='                          	+
		$('select#category').val()  		+
	'&priceFrom='							+
		$('#priceFrom').val()				+
	'&priceTo='                          	+
		$('#priceTo').val()  				+
	'&currencyFilter='                      +
		$('#currencyFilter').val()  		+
	'&q='                      +
		$('#searchtext').val() 	+
	'&vendorSelect='                      +
		$('#vendorSelect').val()  ;


	console.log(url);

	$('#ajaxHitCount').addClass('loading');
	$("#ajaxHitCount").html("&nbsp;");
	$("#ajaxHitDiv").css("display", "block");

	$.ajax({type: "GET", 
		url: url   
	 }).done(function( data ) {
		$('#ajaxHitCount').removeClass('loading');
		var d = JSON.parse(data);
		$("#ajaxHitCount").html(d.searchHitCount);
		$("#ajaxHitDiv").css("display", "block");
	 });
	
}
function registerSearchCallback() {
	return;
//	$('select#escrow').onchange = onSearchUpdated;
//	$('#shipsFrom').change(  onSearchUpdated  ) ;
//	$('select#shippingTo').onchange(onSearchUpdated);
//	$('select#category').onchange(onSearchUpdated); 
}




