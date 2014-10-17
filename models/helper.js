var Helper= function () { };
Helper.getTimeStr = function (dateTime){ 
    if (!dateTime) return "未知";
    var date = new Date(dateTime);
    return date.getFullYear() + "-" + date.getMonth + "-" + date.getDay();+" "+date.getHours()+":"+date.getMinutes()+":"+date.getMilliseconds
}
module.exports = Helper;