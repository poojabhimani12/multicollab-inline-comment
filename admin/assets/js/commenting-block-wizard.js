jQuery(function ($) {

    /**
     * Document ready handler for commenting block wizard page.
     * 
     * Gets browser name and version from bowser.js parser.
     * Handles click events on next buttons to advance wizard steps.
     * Makes AJAX call to submit wizard data on final step.
     * Shows/hides email field based on opt-in checkbox state.
     */
    $(document).ready(function () {

        var result = bowser.getParser(window.navigator.userAgent);
        jQuery('.cf_browser_name_version').val(result.parsedResult.browser.name + ' ' + result.parsedResult.browser.version);

        $(document.body).on('click', '.tab-pane .btn-primary', function () {
            var curruntButton = jQuery(this).closest('.tab-pane').attr('id');
            var nextButton = 'step' + (parseInt(curruntButton.slice(4, 5)) + 1); // Masteringjs.io

            if ('step3' === curruntButton) {

                const freeWizardData = {
                    'action': 'cf_free_plugin_wizard_submit',
                    'subscribe_email': jQuery('.last_step_email_subscription').val(),
                    'opt_in': jQuery('.count_me_in_free').is(":checked"),
                    'broser_name': jQuery('.cf_browser_name_version').val(),
                    'country': jQuery('.cf_country_name').val(),
                };

                $.ajax({
                    url: ajaxurl,
                    data: freeWizardData,
                    success: function (success) {
                        var url = success.replace('&amp;', '&');
                        window.location.href = url;
                        return false;
                    },
                    beforeSend: function () {
                        document.body.classList.add('cf_settings_loader');
                    },
                    complete: function () {
                        document.body.classList.remove('cf_settings_loader');
                    }
                });


            } else {
                jQuery('#' + curruntButton).fadeOut(400, function () {
                    jQuery('#' + nextButton).fadeIn(400);
                });
            }

            if (jQuery('.count_me_in_free').is(":checked")) {
                jQuery('.last_step_description').hide();
                jQuery('.last_step_email_subscription').hide();
            } else {
                jQuery('.last_step_description').show();
                jQuery('.last_step_email_subscription').show();
            }

        });

    });

});

/**
 * Checks if body has setup wizard class, sets padding-top style on html element based on this.
 * For setup wizard, removes padding.
 * For mobile, removes padding. 
 * Otherwise sets padding to 32px.
 */
function javascriptLoad() {
    const bodyHassetup_wizard = document.body.classList.contains('admin_page_multicollab_setup_wizard');
    const el = document.querySelector('html');
    if (bodyHassetup_wizard) {
        el.style.paddingTop = '0px';
    } else if (window.innerWidth <= 600) {
        el.style.paddingTop = '0px';
    } else {
        el.style.paddingTop = '32px';
    }
}

document.addEventListener("DOMContentLoaded", javascriptLoad);
