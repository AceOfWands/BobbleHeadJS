import FrameworkEvent from './FrameworkEvent.js';

export default class PageShownEvent extends FrameworkEvent{
	constructor(data = null){
		super('pageshown', data);
	}
};