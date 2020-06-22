import RestrictedDomNode from "./RestrictedDomNode.js";

export default class RestrictedDomElement extends RestrictedDomNode{
    constructor(domElement, topElement = domElement){
        return super(domElement, topElement);
    }

    wrapResult(result){

        let wrappedResult = super.wrapResult(result);

        if((result instanceof Element) || (result instanceof HTMLCollection)){
            wrappedResult = new RestrictedDomElement(result, this.topElement);
        }

        return wrappedResult;
    }

    get nextElementSibling(){
        return this.domElement == this.topElement ?
            null :
            this.wrapResult(this.domElement.nextElementSibling);
    }

    get previousElementSibling(){
        return this.domElement == this.topElement ?
            null :
            this.wrapResult(this.domElement.previousElementSibling);
    }

    closest(){
        if(this.domElement != this.topElement){

            let realValue = this.domElement.closest.apply(this.domElement, arguments);

            let currentNode = realValue;

            while(currentNode){
                if(currentNode == this.topElement)
                    return this.wrapResult(realValue);
                currentNode = currentNode.parentElement();
            }
        }

        return null;
    }

    insertAdjacentElement(position, element){
        if(this.domElement == this.topElement &&
            (position == 'beforebegin' || position == 'afterend'))
            return;

        return this.domElement.insertAdjacentElement(position, element);
    }

    insertAdjacentHTML(position, text){
        if(this.domElement == this.topElement &&
            (position == 'beforebegin' || position == 'afterend'))
            return;

        return this.domElement.insertAdjacentHTML(position, text);
    }

    insertAdjacentText(position, element){
        if(this.domElement == this.topElement &&
            (position == 'beforebegin' || position == 'afterend'))
            return;

        return this.domElement.insertAdjacentText(position, element);
    }

    createElement(){
        return document.createElement.apply(document, arguments);
    }

    *[Symbol.iterator](){
        for(let item of this.domElement)
            yield this.wrapResult(item);
    }

}