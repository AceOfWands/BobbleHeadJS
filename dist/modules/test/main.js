var m = new BobbleHead.Module('test');
m.manipulate = function(){
	return new Promise(function(resolve, reject) {
		var textnode = document.createTextNode("OK");
		document.appendChild(textnode);  
		resolve();
	}.bind(this));
};
bobblehead.registerModule(m);