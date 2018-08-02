'use strict';
import Session from './Session.js';
import UserPool from './UserPool.js';
import User from './User.js';
import Role from './Role.js';
import RolePool from './RolePool.js';
import Response from './Response.js';
import Request from './Request.js';
import GenericConfiguration from './GenericConfiguration.js';
import Model from './Model.js';
import ModelInstance from './ModelInstance.js';
import ModelPool from './ModelPool.js';
import Route from './Route.js';
import Router from './Router.js';
import Page from './Page.js';
import PageContext from './PageContext.js';
import AccessController from './AccessController.js';
import AuthenticationMethod from './AuthenticationMethod.js';
import AuthenticationMethods from './AuthenticationMethods.js';
import InternalConnector from './InternalConnector.js';
import ExternalConnector from './ExternalConnector.js';
import GenericConnector from './GenericConnector.js';
import Cacher from './Cacher.js';
import PageBuilder from './PageBuilder.js';
import PageFactory from './PageFactory.js';
import Module from './Module.js';
import ModulePool from './ModulePool.js';
import VirtualPage from './VirtualPage.js';
import Database from './Database.js';
import AppController from './AppController.js';
import XMLParser from './XMLParser.js';
import Context from './Context.js';
import FrameworkException from './Exceptions/FrameworkException.js';
import FrameworkError from './Errors/FrameworkError.js';
import FrameworkEvent from './Events/FrameworkEvent.js';
import CacherLoadedEvent from './Events/CacherLoadedEvent.js';
import AccessControllerLoadedEvent from './Events/AccessControllerLoadedEvent.js';
import PageReadyEvent from './Events/PageReadyEvent.js';
import * as Util from './Util.js';
import ConnectorRequest from './ConnectorRequest.js';
import CacherRequest from './CacherRequest.js';
import ModuleConfiguration from './ModuleConfiguration.js';
import PageConfiguration from './PageConfiguration.js';
import PageNotFoundException from './Exceptions/PageNotFoundException.js';
import RedirectException from './Exceptions/RedirectException.js';
import NotSupportedException from './Exceptions/NotSupportedException.js';
import UnauthorizedException from './Exceptions/UnauthorizedException.js';
import InvalidRouteException from './Exceptions/InvalidRouteException.js';
import ControllerNotFoundException from './Exceptions/ControllerNotFoundException.js';
import InvalidAuthenticationMethodException from './Exceptions/InvalidAuthenticationMethodException.js';
import GenericModuleException from './Exceptions/GenericModuleException.js';
import NotSupportedEngineError from './Errors/NotSupportedEngineError.js';

window.bobblehead = (function(a){
	a.BobbleHead = {
		UserPool: UserPool,
		User: User,
		Role: Role,
		RolePool: RolePool,
		Session: Session,
		Response: Response,
		Request: Request,
		ConnectorRequest: ConnectorRequest,
		CacherRequest: CacherRequest,
		GenericConfiguration: GenericConfiguration,
		ModuleConfiguration: ModuleConfiguration,
		PageConfiguration: PageConfiguration,
		Model: Model,
		ModelInstance: ModelInstance,
		ModelPool: ModelPool,
		Route: Route,
		Router: Router,
		Page: Page,
		PageContext: PageContext,
		AccessController: AccessController,
		AuthenticationMethod: AuthenticationMethod,
		AuthenticationMethods: AuthenticationMethods,
		InternalConnector: InternalConnector,
		ExternalConnector: ExternalConnector,
		GenericConnector: GenericConnector,
		Cacher: Cacher,
		PageBuilder: PageBuilder,
		PageFactory: PageFactory,
		Module: Module,
		ModulePool: ModulePool,
		VirtualPage: VirtualPage,
		Database: Database,
		AppController: AppController,
		XMLParser: XMLParser,
		Context: Context,
		defaultCallback: Util.defaultCallback,
		Exceptions: {
			FrameworkException: FrameworkException,
			GenericModuleException: GenericModuleException,
			PageNotFoundException: PageNotFoundException,
			RedirectException: RedirectException,
			NotSupportedException: NotSupportedException,
			UnauthorizedException: UnauthorizedException,
			InvalidRouteException: InvalidRouteException,
			ControllerNotFoundException: ControllerNotFoundException,
			InvalidAuthenticationMethodException: InvalidAuthenticationMethodException
		},
		Errors: {
			FrameworkError: FrameworkError,
			NotSupportedEngineError: NotSupportedEngineError
		},
		Events: {
			FrameworkEvent: FrameworkEvent,
			CacherLoadedEvent: CacherLoadedEvent,
			AccessControllerLoadedEvent: AccessControllerLoadedEvent,
			PageReadyEvent: PageReadyEvent
		},
		Util: Util
	}
	//Main Routine
	return new BobbleHead.AppController('./app.xml');

})(window);

export default window.BobbleHead;