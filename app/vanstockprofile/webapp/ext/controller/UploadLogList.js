sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (ControllerExtension, MessageToast, MessageBox) {
    'use strict';

    return ControllerExtension.extend("com.vanstockprofile.ext.controller.UploadLogList", {

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
            if (oFilterBar) {
                oFilterBar.setFilterValues("uploadedOn", [new Date(sUploadedOn)], true);
            }
        },

        // UNCHANGED — same logic, same signature, still wired by the manifest's existing
        // "press": "com.vanstockprofile.ext.controller.UploadLogList.postProfiles"
        postProfiles: function (oContext, aSelectedContexts) {
            var oModel = null;
            sap.ui.core.Component.registry.forEach(function (oComp) {
                if (!oModel && oComp.getModel && oComp.getModel()) {
                    oModel = oComp.getModel();
                }
            });

            if (!oModel) {
                MessageToast.show("Could not find OData model on control");
                return;
            }

            var oOperation = oModel.bindContext("/postAllProfiles(...)");

            MessageToast.show("Posting all unposted successful rows, please wait...");

            oOperation.execute().then(function () {
                var oResult = oOperation.getBoundContext().getObject();
                MessageToast.show(oResult.message || "Posted successfully");
                oModel.refresh();
            }).catch(function (oError) {
                MessageBox.error("Post failed: " + (oError.message || "Unknown error"));
            });
        }
    });
});