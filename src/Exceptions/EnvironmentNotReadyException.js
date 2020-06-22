import FrameworkException from './FrameworkException.js';

export default class EnvironmentNotReadyException extends FrameworkException{
	constructor(){
		super('enviroment is not ready for interact');
	}
};