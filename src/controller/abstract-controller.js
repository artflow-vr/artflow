'use strict';

import ThreeView from '../view/three-view';

export default class AbstractController {

    constructor() {

        this._view = new ThreeView();
        this._view.setVisible( false );
        this.enabled = false;

    }

    getView() {

        return this._view;

    }

}
