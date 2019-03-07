import Context from './Context.js';
import Sandbox from 'js-sandbox';

export default class PageContext{
	constructor(domcontainer){
		var globalContext = Context.getGlobal();
		for(var x in globalContext){
			this[x] = globalContext[x];
		}
		this.setTimeout = window.__setTimeout;
		this.setInterval = window.__setInterval;
		return new Sandbox(domcontainer, this);
	}
}