/* 
 * some use full utilities
 */

var Utils = function () {

}

Utils.debug_log = function (data, msg)
{
    var err = new Error();
    console.log("---------------Start Steak trace --------------------------")
    console.log("Log info start>>  "+ msg);
    console.log(data);
    console.log(err)
     console.log("---------------End Steak trace --------------------------")
}