export default class XMLParser{
	static getDOMParser(){
		if(XMLParser.domParser == null)
			XMLParser.domParser = new DOMParser();
		return XMLParser.domParser;
	}
	static parseUrl(url,callback){
		var xhttp = new XMLHttpRequest();
		xhttp.open('get', url, true);
		xhttp.responseType = 'text';
		xhttp.onreadystatechange = function(callback){
			if(xhttp.readyState === XMLHttpRequest.DONE){
				callback(this.parseString(xhttp.response));
			}
		}.bind(this,callback);
		xhttp.send();
	}
	static parseString(txt){
		var xmlDoc = null;
		if (window.DOMParser){
			var parser = XMLParser.getDOMParser();
			xmlDoc = parser.parseFromString(txt, "application/xml");
		}else{
			xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.async = false;
			xmlDoc.loadXML(txt);
		}
		return xmlDoc;
	}
};
XMLParser.domParser = null;