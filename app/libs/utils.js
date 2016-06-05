/* 
 * some use full utilities
 */

var Utils = function () {

}

Utils.debug_log = function (data, msg)
{
    var err = new Error();
    console.log("Log info>>  "+ msg);
    console.log(data);
    console.log("---------------Steck trace --------------------------")
    console.log(err)
}