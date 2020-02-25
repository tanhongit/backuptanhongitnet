//============================== FACEBOOK API INIT  ========================== //
if ((wpdiscuzAjaxObj.wpdiscuz_options.enableFbLogin || wpdiscuzAjaxObj.wpdiscuz_options.enableFbShare) && wpdiscuzAjaxObj.wpdiscuz_options.facebookAppID) {
    (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
            return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));


    window.fbAsyncInit = function () {
        FB.init({
            appId: wpdiscuzAjaxObj.wpdiscuz_options.facebookAppID,
            cookie: true,
            xfbml: true,
            version: 'v2.8'
        });
    };
}
function wpcShareCommentFB(url, quote) {
    FB.ui({
        method: 'share',
        href: url,
        quote: quote,
    }, function (response) {});
}

//============================== GOOGLE API INIT  ========================== //

if (wpdiscuzAjaxObj.wpdiscuz_options.enableGoogleLogin && wpdiscuzAjaxObj.wpdiscuz_options.googleAppID) {
    (function (d, s, id) {
        var js, gjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
            return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "https://apis.google.com/js/platform.js?onload=wpdiscuzGooglePlatformInit";
        gjs.parentNode.insertBefore(js, gjs);
    }(document, 'script', 'google-jssdk'));

    function wpdiscuzGooglePlatformInit() {
        if (wpdiscuzAjaxObj.wpdiscuz_options.enableGoogleLogin && wpdiscuzAjaxObj.wpdiscuz_options.googleAppID) {
            gapi.load('auth2', function () {
                gapi.auth2.init({client_id: wpdiscuzAjaxObj.wpdiscuz_options.googleAppID});
            });
        }
    }

}

jQuery(document).ready(function ($) {
    wpdDisplayErrorMessage();
    $(document).delegate('.wc-comment-link .fa-facebook-f', 'click', function () {
        if (wpdiscuzAjaxObj.wpdiscuz_options.enableFbShare != 1) {
            return;
        }
        var commentID = $(this).parents('.wc-comment').find('.wc-comment-right').attr('id');
        var postUrl = window.location.href;
        if (postUrl.indexOf('#') !== -1) {
            postUrl = postUrl.substring(0, postUrl.indexOf('#'));
        }
        postUrl += '#' + commentID;
        var commentContent = $(this).parents('.wc-comment-right').find('.wc-comment-text').text();
        wpcShareCommentFB(postUrl, commentContent);
    });

    var socialLoginContainer, socialLoginProvider = '';
    $(document).delegate('#wpcomm .wpdiscuz-social-login .wpdiscuz-login-button', 'click', function () {
        socialLoginContainer = $(this).parents('.wpdiscuz-social-login');
        socialLoginProvider = wpdInitProvider($(this));
        wpdSocialLoginIsConfirmAgreement(socialLoginProvider, socialLoginContainer);

    });

    $(document).delegate('#wpcomm .wpd-agreement-buttons-right .wpd-agreement-button', 'click', function () {
        socialLoginContainer.parents('.wpdiscuz-ftb-right').next().slideUp(700);
        if ($(this).hasClass('wpd-agreement-button-agree')) {
            if (wpdiscuzAjaxObj.wpdiscuz_options.isCookiesEnabled) {
                Cookies.set('socialLoginAgreementConfirmed', 1, {expires: 30, path: '/'});
            }
            wpdCallSocialLogin(socialLoginProvider, socialLoginContainer);
        }
    });

    function wpdSocialLoginIsConfirmAgreement(provider, container) {
        if (wpdiscuzAjaxObj.wpdiscuz_options.socialLoginAgreementCheckbox != 1 || Cookies.get('socialLoginAgreementConfirmed') == 1) {
            wpdCallSocialLogin(provider, container);
        } else {
            container.parents('.wpdiscuz-ftb-right').next().slideDown(700);
        }
        return false;
    }


    function wpdCallSocialLogin(provider, container) {
        var token, userID = '';
        wpdSocialLoginLoadingBar(container, 1);
       if (provider === 'facebook' && wpdiscuzAjaxObj.wpdiscuz_options.facebookUseOAuth2 == 0) {
            FB.getLoginStatus(function (response) {
                if (response.status === 'connected') {
                    token = response.authResponse.accessToken;
                    userID = response.authResponse.userID;
                    wpdSendRequest(provider, token, userID, container);
                } else {
                    FB.login(function (response) {
                        if (response.status === 'connected') {
                            token = response.authResponse.accessToken;
                            userID = response.authResponse.userID;
                            wpdSendRequest(provider, token, userID, container);
                        }
                    }, {scope: 'public_profile,email'});
                }
            });
        } else 
            if (provider === 'google') {
            var googleAuth = gapi.auth2.getAuthInstance();
            if (googleAuth.isSignedIn.get()) {
                token = googleAuth.currentUser.get().getAuthResponse().id_token;
                wpdSendRequest(provider, token, userID, container);
            } else {
                googleAuth.signIn().then(function (respons) {
                    token = respons.getAuthResponse().id_token;
                    wpdSendRequest(provider, token, userID, container);
                }, function (reason) {
                    console.log(reason.error);
                });
            }
        } else {
            wpdSendRequest(provider, token, userID, container);
        }
    }

    function wpdSendRequest(provider, token, userID, container) {
        var response = '';
        $.ajax({
            type: 'POST',
            url: wpdiscuzAjaxObj.url,
            data: {
                action: 'wpd_social_login',
                provider: provider,
                token: token,
                userID: userID,
                postID: wpdiscuzAjaxObj.wpdiscuz_options.wc_post_id
            }
        }).done(function (wpdiscuz_response) {
            wpdHandleResponse(wpdiscuz_response, container);
        });
        return response;
    }

    function wpdHandleResponse(respons, container) {
        try {
            var obj = $.parseJSON(respons);
            var code = obj.code;
            var message = obj.message;
            var url = obj.url;
            if (parseInt(code) === 200) {
                location.assign(url);
            } else {
                container.append('<div class="wpdiscuz-social-login-error">' + message + '</div>');
            }
        } catch (e) {
            console.log(e);
        }
        wpdSocialLoginLoadingBar(container, 0);
    }

    function wpdDisplayErrorMessage() {
        var errorMessage = Cookies.get('wpdiscuz_social_login_message');
        if (errorMessage && errorMessage !== 'undefined') {
            Cookies.remove('wpdiscuz_social_login_message');
            var container = $('#wpcomm .wpdiscuz-social-login').first();
            $('.wpdiscuz-social-login-error').remove();
            container.append('<div class="wpdiscuz-social-login-error">' + decodeURIComponent(errorMessage.replace(/\+/g, '%20')) + '</div>');
            $('html, body').animate({
                scrollTop: container.offset().top}, 700);
        }
    }

    function wpdInitProvider($obj) {
        var provider = '';
        if ($obj.hasClass('wpdiscuz-facebook-button')) {
            provider = 'facebook';
        }
        if ($obj.hasClass('wpdiscuz-google-button')) {
            provider = 'google';
        }
        if ($obj.hasClass('wpdiscuz-twitter-button')) {
            provider = 'twitter';
        }
        if ($obj.hasClass('wpdiscuz-vk-button')) {
            provider = 'vk';
        }
        if ($obj.hasClass('wpdiscuz-ok-button')) {
            provider = 'ok';
        }
        return provider;
    }

    function wpdSocialLoginLoadingBar(container, show) {
        if (show === 1) {
            container.find('.wpdiscuz-social-login-spinner').show();
        } else {
            container.find('.wpdiscuz-social-login-spinner').hide();
        }
    }
});
