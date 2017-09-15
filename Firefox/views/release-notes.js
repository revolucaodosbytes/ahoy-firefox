$(document).ready( function() {
    $('#ahoy-version').text("v" + browser.runtime.getManifest().version);
});