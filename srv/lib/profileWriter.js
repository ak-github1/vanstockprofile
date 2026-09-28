const cds = require("@sap/cds");

async function upsertProfileLine({
    ProfileHeader, ProfileLine, ChangeLog,
    engineerId, businessUnit, productGroup, productStatus,
    partNumber, quantity, baseUOM, value, userId
}) {
    const dNow = new Date();
    const sDate = dNow.toISOString().slice(0, 10);
    const sTime = dNow.toISOString().slice(11, 19);

    let oHeader = await SELECT.one.from(ProfileHeader).where({ engineerId });

    if (!oHeader) {
        oHeader = {
            ID: cds.utils.uuid(),
            engineerId,
            businessUnit,
            dateCreated: sDate,
            status: 'Active'
        };
        await INSERT.into(ProfileHeader).entries(oHeader);
    }

    const oExistingLine = await SELECT.one.from(ProfileLine)
        .where({ header_ID: oHeader.ID, partNumber });

    if (!oExistingLine) {
        await INSERT.into(ProfileLine).entries({
            ID: cds.utils.uuid(),
            header_ID: oHeader.ID,
            productGroup, productStatus, partNumber,
            quantity, baseUOM, value
        });

        await INSERT.into(ChangeLog).entries({
            ID: cds.utils.uuid(),
            changeDate: sDate, changeTime: sTime, userId, engineerId,
            transactionType: 'AD',
            beforeQuantity: 0, beforeValue: 0,
            afterQuantity: quantity, afterValue: value,
            afterBusinessUnit: businessUnit, afterProductGroup: productGroup,
            afterProductStatus: productStatus, afterPartNumber: partNumber,
            afterBaseUOM: baseUOM
        });
    } else {
        const nNewQty = Number(oExistingLine.quantity) + Number(quantity);
        const nNewVal = Number(oExistingLine.value) + Number(value);

        await UPDATE(ProfileLine).set({ quantity: nNewQty, value: nNewVal })
            .where({ ID: oExistingLine.ID });

        await INSERT.into(ChangeLog).entries({
            ID: cds.utils.uuid(),
            changeDate: sDate, changeTime: sTime, userId, engineerId,
            transactionType: 'AD',
            beforeQuantity: oExistingLine.quantity, beforeValue: oExistingLine.value,
            beforePartNumber: partNumber,
            afterQuantity: nNewQty, afterValue: nNewVal,
            afterPartNumber: partNumber
        });
    }
}
const IN_BATCH = 1000;
const chunk = (a, n) => { const r = []; for (let i = 0; i < a.length; i += n) r.push(a.slice(i, i + n)); return r; };
const round3 = (n) => Math.round(n * 1000) / 1000;
const round2 = (n) => Math.round(n * 100) / 100;

function createBulkProfileWriter(sUserId) {
    const { VanStockProfileHeader: Header, VanStockProfileLine: Line, ChangeLogs: Log } = cds.entities('vanstock');
    const oHeaders = new Map(); // engineerId -> header (kept across result sets)
    const oLines = new Map();   // `${header_ID}|${partNumber}` -> line

    async function write(aRows) {
        // 1. Load existing headers and lines for engineers not seen yet
        const aUnknown = [...new Set(aRows.map(r => r.engineerId))].filter(e => !oHeaders.has(e));
        for (const aPart of chunk(aUnknown, IN_BATCH)) {
            const aH = await SELECT.from(Header).where({ engineerId: { in: aPart } });
            aH.forEach(h => oHeaders.set(h.engineerId, h));
            for (const aIds of chunk(aH.map(h => h.ID), IN_BATCH)) {
                const aL = await SELECT.from(Line).where({ header_ID: { in: aIds } });
                aL.forEach(l => oLines.set(`${l.header_ID}|${l.partNumber}`, l));
            }
        }

        // 2. Insert missing headers in one statement
        const dNow = new Date();
        const sDate = dNow.toISOString().slice(0, 10), sTime = dNow.toISOString().slice(11, 19);
        const aNewHeaders = [];
        for (const r of aRows) {
            if (!oHeaders.has(r.engineerId)) {
                const h = {
                    ID: cds.utils.uuid(), engineerId: r.engineerId,
                    businessUnit: r.businessUnit, dateCreated: sDate, status: 'Active'
                };
                oHeaders.set(r.engineerId, h);
                aNewHeaders.push(h);
            }
        }
        if (aNewHeaders.length) await INSERT.into(Header).entries(aNewHeaders);

        // 3. Compute lines and ChangeLog in memory, in row order
        const oTouched = new Map();
        const aLog = [];
        for (const r of aRows) {
            const h = oHeaders.get(r.engineerId);
            const k = `${h.ID}|${r.partNumber}`;
            let l = oLines.get(k);

            if (!l) {
                l = {
                    ID: cds.utils.uuid(), header_ID: h.ID, productGroup: '', productStatus: '',
                    partNumber: r.partNumber, quantity: round3(r.quantity), baseUOM: '', value: round2(r.value)
                };
                oLines.set(k, l);
                oTouched.set(k, l);
                aLog.push({
                    ID: cds.utils.uuid(), changeDate: sDate, changeTime: sTime,
                    userId: sUserId, engineerId: r.engineerId, transactionType: 'AD',
                    beforeQuantity: 0, beforeValue: 0,
                    afterQuantity: l.quantity, afterValue: l.value,
                    afterBusinessUnit: r.businessUnit, afterProductGroup: '',
                    afterProductStatus: '', afterPartNumber: r.partNumber, afterBaseUOM: ''
                });
            } else {
                const nBQ = Number(l.quantity), nBV = Number(l.value);
                l.quantity = round3(nBQ + r.quantity);
                l.value = round2(nBV + r.value);
                oTouched.set(k, l);
                aLog.push({
                    ID: cds.utils.uuid(), changeDate: sDate, changeTime: sTime,
                    userId: sUserId, engineerId: r.engineerId, transactionType: 'AD',
                    beforeQuantity: nBQ, beforeValue: nBV, beforePartNumber: r.partNumber,
                    afterQuantity: l.quantity, afterValue: l.value, afterPartNumber: r.partNumber
                });
            }
        }

        // 4. One UPSERT for lines, one INSERT for ChangeLog
        await UPSERT.into(Line).entries([...oTouched.values()]);
        await INSERT.into(Log).entries(aLog);
    }

    return { write };
}

module.exports = { upsertProfileLine, createBulkProfileWriter };