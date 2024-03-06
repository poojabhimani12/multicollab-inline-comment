/**
 * Add event listeners when document is ready.
 * On click of close button with class .cf-pluginpop-close:
 * - Get popup name from data-popup-name attribute
 * - Set cookie to hide popup for 7 days 
 * - Hide popup element with class matching popup name
*/
jQuery(function ($) {
    $(document).ready(function () {
        $(document).on('click', '.cf-pluginpop-close', function () {
            var popupName = $(this).attr('data-popup-name');
            setCookieGeneral('banner_' + popupName, "yes", 60 * 24 * 7);
            $('.' + popupName).hide();
        });

    });
});

/**
 * Sets a cookie with the given name, value and expiry time in minutes. 
 * 
 * @param {string} name - The name of the cookie to set.
 * @param {string} value - The value to set for the cookie.
 * @param {number} minutes - The expiry time for the cookie in minutes.
 */
function setCookieGeneral(name, value, minutes) {
    var expires = "";
    if (minutes) {
        var date = new Date();
        date.setTime(date.getTime() + (minutes * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
