"use strict";

const http = require("http");
const https = require("https");

let client = (connection) => {
    let options = {
        host: connection.host,
        port: connection.port,
        method: "POST",
        key: connection.key,
        cert: connection.cert,
        agent: connection.agent,
        pfx: connection.pfx,
        passphrase: connection.passphrase,
        ca: connection.ca,
        ciphers: connection.ciphers,
        rejectUnauthorized: connection.rejectUnauthorized,
        secureProtocol: connection.secureProtocol,
        servername: connection.servername,
        headers: { 'Content-Type': 'application/json', host: connection.host }
    };

    if (connection.user && connection.pass) {
        options.auth = connection.user + ":" + connection.pass;
    }

    return {
        call: (method, params, cb) => {
            
                let payload = { method: method, params: [], id: 1, jsonrpc: '2.0' };
                if (params) {
                    if(payload.method=="publish"  || payload.method=="publishfrom"){ 
                        var value=JSON.stringify(params[2])
                        let bufStr = Buffer.from(value, 'utf8');
                        var hexstring = bufStr.toString('hex')
                        params[2]=hexstring;
                        payload.params = params;
                    }  
                    else{    
                        payload.params = params;
                    }
                }
                
                let body = JSON.stringify(payload);
                options.headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
                
                if (connection.protocol === "https") {
                    var req = https.request(options);
                } else {
                    var req = http.request(options);
                }

                let data = "";

                req.on('error', (e) => {
                    cb(e);
                });

                req.write(JSON.stringify(payload));
                req.on("response", (res) => {
                    
                    res.on('data', (chunk) => {
                        data += chunk;
                    })
                    res.on('end', () => {
                        let response;
                        if (res.statusCode === 200) {
                           
                            response = JSON.parse(data);
                            if(method=="liststreamkeyitems"){
                            var length = response.result.length
                            var string = '';
                            data = response.result[length - 1].data;
                            string = Buffer.from(data, 'hex').toString();
                            response.result[length - 1].data=JSON.parse(string);
                            return cb(null, response.result[length - 1]);
                            }

                            return cb(null, response.result);

                        } else if (res.headers['content-type'] === "application/json") {

                            response = JSON.parse(data);
                            return cb(response.error);

                        } else {
                            
                            return cb(data);

                        }
                    })
                })
                req.end();
            }
        }

}

module.exports = client;
