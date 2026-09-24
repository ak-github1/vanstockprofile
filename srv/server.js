const cds = require('@sap/cds');
const express = require('express');

cds.on('bootstrap', (app) => {
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
});

// Enable On Select: object page line items are editable only when ticked
cds.on('served', (services) => {
    if (services.VanStockProfile) {
        require('./lib/lineSelect')(services.VanStockProfile);
    }
});

module.exports = cds.server;