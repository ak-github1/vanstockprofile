sap.ui.define([], function () {
    'use strict';

    // "Upload Logs" button on the Van Stock Profiles list -> opens the Upload Logs page
    return {
        openUploadLogs: function () {
            this.routing.navigateToRoute("UploadLogList");
        }
    };
});