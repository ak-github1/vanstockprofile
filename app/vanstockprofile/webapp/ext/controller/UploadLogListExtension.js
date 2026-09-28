sap.ui.define(["sap/ui/core/mvc/ControllerExtension"], function (ControllerExtension) {
    "use strict";
    return ControllerExtension.extend("com.vanstockprofile.ext.controller.UploadLogListExtension", {
        override: {
            onInit: function () {
                this.base.getAppComponent().getRouter()
                    .getRoute("UploadLogList")
                    .attachPatternMatched(this._onRouteMatched, this);
            }
        },
        _onRouteMatched: function (oEvent) {
            var oQuery = (oEvent.getParameter("arguments") || {})["?query"] || {};
            var sUploadedOn = oQuery.uploadedOn;
            if (!sUploadedOn) return;
            var oFilterBar = this.base.getExtensionAPI().getFilterBar();
            if (oFilterBar) { oFilterBar.setFilterValues("uploadedOn", [new Date(sUploadedOn)], true); }
        }
    });
});