(function($){

    'use strict';

    window.jnews.selectShare = window.jnews.selectShare || {};

    window.jnews.selectShare =
        {
            init: function( $container )
            {
                let base = this;

                if ( $container === undefined )
                {
                    base.container = $('body');
                } else {
                    base.container = $container;
                }
                
                base.menu = $('#selectShareContainer');
                base.menuInner = base.menu.find('.selectShare-inner');
                base.menuButton = base.menuInner.find('button');
                base.selected_text = '';

                this.setEvent();
            },
            setEvent: function() {
                let base = this;

                base.container.on('mousedown vmousedown', function(e){
                    base.handleMouseDown(e);
                });
                base.container.on('mouseup vmouseup', function(){
                    base.handleSelection();
                });
                document.addEventListener("selectionchange", function() {
                    base.hasGetSelection();
                }, false);
                base.menuButton.on('click', function (e) {
                    e.preventDefault();
                    base.buttonClick($(this));
                });
            },
            buttonClick: function(button){
                let base = this;
                var social = button.attr('class').split(' ')[1].replace('jeg_btn-', '');
                var button_url = button.attr('data-url').replace('[selected_text]', base.selected_text);


                if( jnews_select_share.is_customize_preview ) {
                    return;
                }
                window.open( button_url, social,"width=575,height=430,toolbar=false,menubar=false,location=false,status=false");
            },
            handleMouseDown: function(e){
               if ($(e.target).parents('.content-inner').length != 1 && $(e.target).parents('.entry-header').length != 1) {
                   if (window.getSelection().empty) {
                       window.getSelection().empty();
                   }
                   if (window.getSelection().removeAllRanges) {
                       window.getSelection().removeAllRanges();
                   }
               }
            },
            replaceData: function() {
                let base = this;
                base.menuButton.each(function () {
                    var post_url = ($(this).attr('data-post-url')) ? ($(this).attr('data-post-url')) : null,
                        image_url = ($(this).attr('data-image-url')) ? ($(this).attr('data-image-url')) : null,
                        title = ($(this).attr('data-title')) ? ($(this).attr('data-title')) : null,
                        button_url = $(this).attr('data-url');
                    if(button_url.indexOf('[image_url]')) {
                        $(this).attr('data-url', button_url.replace('[image_url]', image_url));
                        button_url = $(this).attr('data-url');
                    }
                    if(button_url.indexOf('[url]')) {
                        $(this).attr('data-url', button_url.replace('[url]', post_url));
                        button_url = $(this).attr('data-url');
                    }
                });
            },
            handleSelection: function(){
                let base = this;
                var selection;

                if (window.getSelection) {
                    selection = window.getSelection();
                } else if (document.selection) {
                    selection = document.selection.createRange();
                }

                if (selection.rangeCount <= 0) return;

                var range = selection.getRangeAt(0);

                if (range && selection.toString()) {
                    base.selected_text = encodeURIComponent(selection.toString());
                    base.replaceData();

                    if ($(selection.baseNode || selection.anchorNode).parents('.content-inner').length != 1) {
                        return;
                    }

                    var postition = range.getBoundingClientRect();
                    if (postition.left || postition.top) {
                        base.menuInner.css({
                            left: postition.left + postition.width / 2 - base.menuInner.width() / 2,
                            top: postition.top + window.pageYOffset - base.menuInner.height() - 11,
                            display: 'block',
                            opacity: 0
                        }).animate({
                            opacity: 1
                        }, 100);

                        setTimeout(function () {
                            base.menuInner.addClass('select_share_menu_animate');
                        }, 10);
                        return;
                    }
                }
                base.menuInner.animate({ opacity: 0 }, function () {
                    base.menuInner.hide().removeClass('select_share_menu_animate');
                });
            },
            hasGetSelection: function(){
                let base = this;
                var selection = window.getSelection();
                var text = selection.toString();
                if ( '' == text ) {
                    return;
                } else {
                    base.selected_text = text;
                }
            }
        };
        jnews.selectShare.init();

})(jQuery);
