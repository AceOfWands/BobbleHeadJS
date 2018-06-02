import InvalidRouteException from './Exceptions/InvalidRouteException.js';

export default class Route{
	constructor(uri1, uri2){
		if(uri1.startsWith('app://') && uri2.startsWith('app://')){
			var argMap = {};
			var count = {i: 0};
			this.uri1 = new RegExp("^" + uri1.replace(/:[^\s/]+/g, function(count, _match){
				count.i += 1;
				this[_match.substring(1)] = count.i;
				return '([\\w-]+)';
			}.bind(argMap, count)) + "$");
			this.uri2 = uri2.replace(/:[^\s/]+/g, function(_match){
				var indx = this[_match.substring(1)];
				if(indx)
					return '$'+ indx;
				else
					return _match;
			}.bind(argMap));
		}else
			throw new InvalidRouteException();
	}
	match(uri){
		return this.uri1.test(uri);
	}
	route(uri){
		if(!this.match(uri)) return null;
		return uri.replace(this.uri1,this.uri2);
	}
}