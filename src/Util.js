export function log(data,level = null,...description){
	if(level!=null){
		if(parseInt(level)>1)			
			console.error('['+data+'] ', description);
		else
			console.log('['+data+'] ', description)
	}else
		console.log(data);
};
export function defaultCallback(){
	if(arguments.length>0)
		log(arguments);
};
export const isRemoteURIPattern = /^(ftp[s]?|http[s]?|file):\/\//i;
export const vidInURIPattern = /^([0-9]+|back)\/?/;
export const strInURIPattern = /^([\w]+)\/?/;
export function getClassFromName(str, top = window){
	var currentScope = top;
	var objectPath = str.split('.');
	for(var i=0; i < objectPath.length; i++){
		currentScope = currentScope[objectPath[i]];
	}
	return currentScope;
};
export function absoluteURL(base, relative, trailingSlash = true) {
	var stack = base.split("/"),
		parts = relative.split("/");
	if(trailingSlash)
		stack.pop(); // remove current file name (or empty string)
					 // (omit if "base" is the current folder without trailing slash)
	for (var i=0; i<parts.length; i++) {
		if (parts[i] == ".")
			continue;
		if (parts[i] == "..")
			stack.pop();
		else
			stack.push(parts[i]);
	}
	return stack.join("/");
};
export function execFuncWithArgList(f, args) {
	var params = [f].concat(args);
	return f.bind.apply(f, params);
};
export function serializeFormData(fd){
	var r = [];
	for(var x of fd.entries())
		r.push(x[0]+'='+x[1]);
	return r.join('&');
};
export function convertDomToMap(element){
	var resultMap = {};
	for(var childNode of element.childNodes){
		if(childNode instanceof Element)
			if (childNode.hasChildNodes())
				if(childNode.childNodes.length == 1 &&
					childNode.childNodes[0].nodeType == Node.TEXT_NODE)
					resultMap[childNode.tagName] = childNode.textContent;
				else
					resultMap[childNode.tagName] = convertDomToMap(childNode);
			else
				resultMap[childNode.tagName] = childNode.textContent;
	}
	return resultMap;
};
export {default as Heap} from './Util/Heap/Heap.js';
export {default as HeapNode} from './Util/Heap/HeapNode.js';
export {default as ReverseHeap} from './Util/Heap/ReverseHeap.js';
export {default as Environment} from './Util/Dom/Environment.js';
export {default as ExtendedDomElement} from './Util/Dom/ExtendedDomElement.js';
export {default as RestrictedDomNode} from './Util/Dom/RestrictedDomNode.js';
export {default as RestrictedDomElement} from './Util/Dom/RestrictedDomElement.js';