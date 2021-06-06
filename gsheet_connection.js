// googleSheet.js

const { GoogleSpreadsheet } = require('google-spreadsheet');

/**
 * @param  {String} docID the document ID
 * @param  {String} sheetID the google sheet table ID
 * @param  {String} credentialsPath the credentials path defalt is './credentials.json'
 */
async function getData(docID, sheetID, credentialsPath = './private/credentials.json') {
    const result = [];
    const doc = new GoogleSpreadsheet(docID);
    const creds = require(credentialsPath);
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsById[sheetID];
    const rows = await sheet.getRows();
    for (row of rows) {
        result.push(row._rawData);
    }
    return result;
};

function getTasselData(callback) {
    (async () => {
        var tassel = []
        const resp = await getData('1O8XZliILAcL56Q2GYc-5-rrhreJtDVZXnIqDiXetuIE', '1892511914');
        resp.forEach((row) => {
            if (row.length > 1) {
                tassel.push(
                    {
                        "Teacher": row[0],
                        "Students": row.slice(2),
                        "Essay": row[1]
                    })
            }
        })
        callback(tassel);
    })();
}

module.exports = {
    getData,
    getTasselData
};