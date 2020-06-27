import Session from './Session.js';
import User from './User.js';
import Role from './Role.js';
import Response from './Response.js';
import ConnectorRequest from './ConnectorRequest.js';
import Model from './Model.js';
import ModelInstance from './ModelInstance.js';
import Route from './Route.js';
import Page from './Page.js';
import PageContext from './PageContext.js';
import AuthenticationMethod from './AuthenticationMethod.js';
import AuthenticationMethods from './AuthenticationMethods.js';
import PageFactory from './PageFactory.js';
import Module from './Module.js';
import VirtualPage from './VirtualPage.js';
import FrameworkException from './Exceptions/FrameworkException.js';
import FrameworkError from './Errors/FrameworkError.js';
import FrameworkEvent from './Events/FrameworkEvent.js';
import AccessControllerLoadedEvent from './Events/AccessControllerLoadedEvent.js';
import PageReadyEvent from './Events/PageReadyEvent.js';
import PageShownEvent from './Events/PageShownEvent.js';
import * as Util from './Util.js';
import GenericConnector from './GenericConnector.js';
import ModelPool from './ModelPool.js';
import UserPool from './UserPool.js';
import RolePool from './RolePool.js';
import PageConfiguration from './PageConfiguration.js';
import PageNotFoundException from './Exceptions/PageNotFoundException.js';
import RedirectException from './Exceptions/RedirectException.js';
import NotSupportedException from './Exceptions/NotSupportedException.js';
import UnauthorizedException from './Exceptions/UnauthorizedException.js';
import InvalidRouteException from './Exceptions/InvalidRouteException.js';
import ControllerNotFoundException from './Exceptions/ControllerNotFoundException.js';
import ModelNotFoundException from './Exceptions/ModelNotFoundException.js';
import InvalidAuthenticationMethodException from './Exceptions/InvalidAuthenticationMethodException.js';
import GenericModuleException from './Exceptions/GenericModuleException.js';
import NotSupportedEngineError from './Errors/NotSupportedEngineError.js';
import PageBuilder from './PageBuilder.js';
import AppController from './AppController.js';
import Context from './Context.js';
import ModulePool from './ModulePool.js';

export default class SafeBobbleHead{
    constructor(permissions = []){
        Object.defineProperties(this, {
            User: {
                value: User,
                writable: false
            },
            Role: {
                value: Role,
                writable: false
            },
            Session: {
                value: Session,
                writable: false
            },
            Response: {
                value: Response,
                writable: false
            },
            ConnectorRequest: {
                value: ConnectorRequest,
                writable: false
            },
            Model: {
                value: Model,
                writable: false
            },
            ModelInstance: {
                value: ModelInstance,
                writable: false
            },
            Route: {
                value: Route,
                writable: false
            },
            Page: {
                value: Page,
                writable: false
            },
            PageContext: {
                value: PageContext,
                writable: false
            },
            AuthenticationMethod: {
                value: AuthenticationMethod,
                writable: false
            },
            AuthenticationMethods: {
                value: AuthenticationMethods,
                writable: false
            },
            PageFactory: {
                value: PageFactory,
                writable: false
            },
            Module: {
                value: Module,
                writable: false
            },
            VirtualPage: {
                value: VirtualPage,
                writable: false
            },
            Exceptions: {
                value: {
                    get FrameworkException(){return FrameworkException},
                    set FrameworkException(x){},
                    get GenericModuleException(){return GenericModuleException},
                    set GenericModuleException(x){},
                    get PageNotFoundException(){return PageNotFoundException},
                    set PageNotFoundException(x){},
                    get RedirectException(){return RedirectException},
                    set RedirectException(x){},
                    get NotSupportedException(){return NotSupportedException},
                    set NotSupportedException(x){},
                    get UnauthorizedException(){return UnauthorizedException},
                    set UnauthorizedException(x){},
                    get InvalidRouteException(){return InvalidRouteException},
                    set InvalidRouteException(x){},
                    get ControllerNotFoundException(){return ControllerNotFoundException},
                    set ControllerNotFoundException(x){},
                    get ModelNotFoundException(){return ModelNotFoundException},
                    set ModelNotFoundException(x){},
                    get InvalidAuthenticationMethodException(){return InvalidAuthenticationMethodException},
                    set InvalidAuthenticationMethodException(x){},
                },
                writable: false
            },
            Errors: {
                value: {
                    FrameworkError: FrameworkError,
                    NotSupportedEngineError: NotSupportedEngineError
                },
                writable: false
            },
            Events: {
                value: {
                    get FrameworkEvent(){return FrameworkEvent},
                    set FrameworkEvent(x){},
                    get AccessControllerLoadedEvent(){return AccessControllerLoadedEvent},
                    set AccessControllerLoadedEvent(x){},
                    get PageReadyEvent(){return PageReadyEvent},
                    set PageReadyEvent(x){},
                    get PageShownEvent(){return PageShownEvent},
                    set PageShownEvent(x){},
                },
                writable: false
            },
            Util: {
                value: Util,
                writable: false
            },
            app: {
                value: AppController.getInstance(),
                writable: false
            }
        });
        for(let permission of permissions){
            if(permission == 'pages'){
                Object.defineProperties(this, {
                    PageFactory: {
                        value: PageFactory,
                        writable: false
                    },
                    PageBuilder: {
                        value: PageBuilder,
                        writable: false
                    },
                    PageConfiguration: {
                        value: PageConfiguration,
                        writable: false
                    },
                    Context: {
                        value: Context,
                        writable: false
                    },
                    ModulePool: {
                        value: ModulePool,
                        writable: false
                    }
                });
            }else if(permission == 'users'){
                Object.defineProperties(this, {
                    UserPool: {
                        value: UserPool,
                        writable: false
                    },
                    RolePool: {
                        value: RolePool,
                        writable: false
                    }
                });
            }else if(permission == 'models'){
                Object.defineProperties(this, {
                    ModelPool: {
                        value: ModelPool,
                        writable: false
                    }
                });
            }else if(permission == 'connector'){
                Object.defineProperties(this, {
                    GenericConnector: {
                        value: GenericConnector,
                        writable: false
                    }
                });
            }
        }
    }
}