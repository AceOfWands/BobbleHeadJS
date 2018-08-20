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
export const isRemoteURIPattern = /^http[s]?:\/\//i;
export const vidInURIPattern = /^([0-9]+|back)\/?/;
export const strInURIPattern = /^([\w]+)\/?/;
export function getClassFromName(str, top = window){
	var curr = top;
	var _clss = str.split('.');
	for(var i=0; i<_clss.length; i++){
		curr = curr[_clss[i]];
	}
	return curr;
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
export {default as Heap} from './Util/Heap.js';
export {default as HeapNode} from './Util/HeapNode.js';
export {default as ReverseHeap} from './Util/ReverseHeap.js';