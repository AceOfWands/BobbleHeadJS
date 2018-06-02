import FrameworkException from './FrameworkException.js';

export default class RedirectException extends FrameworkException{
	constructor(vid, data = null){
		super();
		this.vid = vid;
		this.data = data;
	}
};