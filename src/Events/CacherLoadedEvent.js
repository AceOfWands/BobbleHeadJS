import FrameworkEvent from './FrameworkEvent.js';

export default class CacherLoadedEvent extends FrameworkEvent{
	constructor(data = null){
		super('cacherloaded', data);
	}
};