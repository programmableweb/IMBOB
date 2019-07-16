
const getRuntimeInfo = (request) => {
    const UNKNOWN_OR_INACCESSIBLE = 'UNKNOWN_OR_INACCESSIBLE';
    let networkInfo;
    try {
        networkInfo = require('os').networkInterfaces();
    } catch (e) {
        networkInfo = UNKNOWN_OR_INACCESSIBLE;
    }

    const runtimeInfo =  { processId: process.pid, memoryUsage: process.memoryUsage(), networkInfo};
    runtimeInfo.currentTime = new Date();
    if(request){
        runtimeInfo.requestHeaders = request.headers;
        runtimeInfo.requestUrl = request.url || UNKNOWN_OR_INACCESSIBLE;
        runtimeInfo.remoteAddress = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    }

    return runtimeInfo;
};

module.exports = {getRuntimeInfo};
