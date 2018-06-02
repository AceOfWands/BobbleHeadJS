import {log} from './Util.js';

export default class PageFactory{
	static getPage(virtualID){
		return PageFactory.pages[virtualID];
	}
	static addPage(page){
		try{
			PageFactory.pages[page.vid] = page;
		}catch(e){
			log(e);
		}
	}
}
PageFactory.pages = {};