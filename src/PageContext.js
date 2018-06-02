import Context from './Context.js';

export default class PageContext{
	constructor(domcontainer){
		var globalContext = Context.getGlobal();
		for(var x in globalContext){
			this[x] = globalContext[x];
		}
		return new Sandbox(domcontainer, this);
	}
}