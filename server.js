var connect = require('connect');

var mapHard = connect()
    .use(connect.static('website'))
    .use(badReqHandler)
    .listen(process.env.PORT);
    
function badReqHandler(request,response){
    response.statusCode = 403;
    response.end("Bad Request");
}