import FrameworkEvent from './FrameworkEvent.js';

export default class AccessControllerLoadedEvent extends FrameworkEvent{
	constructor(data = null){
		super('acloaded', data);
	}
};