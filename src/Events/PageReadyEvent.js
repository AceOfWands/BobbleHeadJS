import FrameworkEvent from './FrameworkEvent.js';

export default class PageReadyEvent extends FrameworkEvent{
	constructor(data = null){
		super('pageready', data);
	}
};